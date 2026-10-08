defmodule Operately.Analytics do
  @moduledoc "Conversion tracking, independent of installation beacons and product activities."
  import Ecto.Query
  alias Operately.Repo
  alias Operately.Analytics.{AccountState, CompanyState, Activation, Context, Delivery}

  def config, do: Application.get_env(:operately, :conversion_analytics, []) || []
  def enabled?, do: config()[:enabled] == true and is_binary(config()[:token]) and config()[:token] != ""
  def opted_out?(nil), do: false

  def opted_out?(id) do
    case Repo.get(AccountState, id) do
      nil -> false
      state -> state.opted_out
    end
  end

  def enqueue_step(multi, name, callback) do
    Ecto.Multi.run(multi, name, fn _repo, changes ->
      if enabled?(), do: callback.(changes)
      {:ok, :ok}
    end)
  end

  @doc """
  Marks an invited account as pending signup without sending an event.
  Acceptance/authentication later completes signup through complete_invitation/2.
  """
  def provision_account(account) do
    if enabled?() do
      Repo.insert!(%AccountState{account_id: account.id, signup_kind: :invitation}, on_conflict: :nothing)
    end

    :ok
  end

  def register_account(account, context) do
    if enabled?() do
      state = %AccountState{
        account_id: account.id,
        attribution: Context.attribution(context[:attribution]),
        opted_out: context[:preference] == "denied",
        signup_kind: context[:signup_kind] || :self_service
      }

      Repo.insert!(state, on_conflict: :nothing)

      account.id
      |> load_and_lock_account()
      |> update_preference(context)
      |> complete_signup(context)
    end

    :ok
  end

  def complete_invitation(account, context) do
    if enabled?() do
      Repo.transaction(fn ->
        case Repo.one(from a in AccountState, where: a.account_id == ^account.id, lock: "FOR UPDATE") do
          %AccountState{signup_kind: :invitation, completed_at: nil} = state ->
            state |> update_preference(context) |> complete_pending_invitation(context)

          _ ->
            :ok
        end
      end)
    end

    :ok
  end

  @doc """
  Saves login tracking preferences and completes any pending invitation signup
  in one transaction. Existing accounts never become new signups.
  """
  def on_login(account, context) do
    if enabled?() do
      Repo.transaction(fn ->
        Repo.insert!(%AccountState{account_id: account.id}, on_conflict: :nothing)

        account.id
        |> load_and_lock_account()
        |> update_preference(context)
        |> complete_pending_invitation(context)
      end)
    end

    :ok
  end

  @doc """
  Ensures an analytics record exists and saves any opt-out from the request context.
  Never clears an existing opt-out or changes attribution. Does nothing without
  an account or when tracking is disabled.
  """
  def sync_account(nil, _context), do: :ok

  def sync_account(account, context) do
    if enabled?() do
      Repo.transaction(fn ->
        Repo.insert!(%AccountState{account_id: account.id}, on_conflict: :nothing)
        state = load_and_lock_account(account.id)
        update_preference(state, context)
      end)
    end

    :ok
  end

  defp update_preference(state, %{preference: "denied"}), do: Repo.update!(Ecto.Changeset.change(state, opted_out: true))
  defp update_preference(state, _), do: state

  defp complete_pending_invitation(%AccountState{signup_kind: :invitation, completed_at: nil} = state, context) do
    state
    |> Ecto.Changeset.change(attribution: Context.attribution(context[:attribution]))
    |> Repo.update!()
    |> complete_signup(context)
  end

  defp complete_pending_invitation(_state, _context), do: :ok

  defp complete_signup(state, context) do
    if state.completed_at == nil and state.signup_kind != nil do
      now = DateTime.utc_now()
      Repo.update!(Ecto.Changeset.change(state, completed_at: now))

      if not state.opted_out do
        link_anonymous(state.account_id, context, now)
        enqueue("signup_completed", state.account_id, nil, state.attribution, Map.put(context, :signup_kind, state.signup_kind), now)
      end
    end
  end

  defp link_anonymous(account_id, context, now) do
    anonymous_id = context[:anonymous_id]
    # Browser context must not link a different real account to the authenticated one.
    if anonymous_id && anonymous_id != account_id && is_nil(Repo.get(Operately.People.Account, anonymous_id)) do
      enqueue("$identify", account_id, nil, %{}, context, now, %{"$anon_distinct_id" => anonymous_id})
    end
  end

  def workspace_created(company, account, context) do
    if enabled?() and account do
      sync_account(account, context)
      account_state = Repo.get(AccountState, account.id)

      attribution =
        case account_state do
          nil -> %{}
          state -> state.attribution
        end

      state = %CompanyState{company_id: company.id, creator_account_id: account.id, attribution: attribution, created_at: as_datetime(company.inserted_at)}
      {count, _} = Repo.insert_all(CompanyState, [Map.from_struct(state) |> Map.delete(:__meta__)], on_conflict: :nothing)

      if count == 1 and not opted_out?(account.id) do
        enqueue("workspace_created", account.id, company.id, attribution, context, state.created_at, %{
          "creator_kind" => (account_state && account_state.signup_kind) || "existing_account",
          "creator_account_id" => account.id
        })
      end
    end

    :ok
  end

  def activate(company_id, account_id, context, now \\ DateTime.utc_now()) do
    now = as_datetime(now)

    if enabled?() and not is_nil(account_id) do
      if context[:preference] == "denied", do: sync_account(%{id: account_id}, context)
      state = Repo.one(from c in CompanyState, where: c.company_id == ^company_id, lock: "FOR UPDATE")

      if qualifies?(state, now) do
        attrs = %{company_id: company_id, rule_version: 1, activated_at: as_datetime(now)}
        {count, _} = Repo.insert_all(Activation, [attrs], on_conflict: :nothing)

        if count == 1 and not opted_out?(account_id) and not opted_out?(state.creator_account_id) do
          enqueue("workspace_activated", account_id, company_id, state.attribution, context, now, %{"rule_version" => 1, "creator_account_id" => state.creator_account_id})
        end
      end
    end

    :ok
  end

  # Tracked workspaces qualify from creation (inclusive) until 7 days later (exclusive).
  defp qualifies?(%CompanyState{created_at: created_at}, now) do
    DateTime.compare(now, created_at) != :lt and DateTime.compare(now, DateTime.add(created_at, 168, :hour)) == :lt
  end

  defp qualifies?(_, _), do: false

  defp load_and_lock_account(id), do: Repo.one!(from a in AccountState, where: a.account_id == ^id, lock: "FOR UPDATE")

  defp as_datetime(%DateTime{} = time), do: %{time | microsecond: {elem(time.microsecond, 0), 6}}
  defp as_datetime(%NaiveDateTime{} = time), do: DateTime.from_naive!(time, "Etc/UTC") |> as_datetime()

  defp enqueue(event, account_id, company_id, attribution, context, now, extra \\ %{}) do
    properties =
      %{
        "schema_version" => 1,
        "account_id" => account_id,
        "company_id" => company_id,
        "channel" => context[:channel] || "api",
        "acquisition" => attribution,
        "signup_kind" => context[:signup_kind],
        "$process_person_profile" => true
      }
      |> Map.merge(extra)

    properties = if company_id, do: Map.put(properties, "$groups", %{"company" => company_id}), else: properties
    event = %{"uuid" => Ecto.UUID.generate(), "event" => event, "distinct_id" => account_id, "timestamp" => DateTime.to_iso8601(now), "properties" => properties}
    %{"event" => event} |> Delivery.new() |> Oban.insert!()
  end
end

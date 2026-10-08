defmodule Operately.AnalyticsTest do
  use Operately.DataCase
  import Ecto.Query
  alias Operately.{Analytics, Repo}
  alias Operately.Analytics.{AccountState, CompanyState, Activation, Delivery}
  alias Operately.Support.Factory

  setup do
    Process.put(:oban_testing, :manual)
    previous = Application.get_env(:operately, :conversion_analytics)
    Application.put_env(:operately, :conversion_analytics, enabled: false)
    ctx = Factory.setup(%{})
    Application.put_env(:operately, :conversion_analytics, enabled: true, token: "test", host: "https://us.i.posthog.com")
    on_exit(fn -> Application.put_env(:operately, :conversion_analytics, previous) end)
    {:ok, Map.put(ctx, :account, Repo.get!(Operately.People.Account, ctx.creator.account_id))}
  end

  test "registration is once per account and attribution is immutable", ctx do
    context = %{attribution: %{"utm_source" => "test"}, channel: "web"}
    Repo.transaction(fn -> Analytics.register_account(ctx.account, context) end)
    Repo.transaction(fn -> Analytics.register_account(ctx.account, %{attribution: %{"utm_source" => "later"}}) end)
    assert Repo.get!(AccountState, ctx.account.id).attribution == %{"utm_source" => "test"}
    assert Repo.get!(AccountState, ctx.account.id).signup_kind == :self_service
    [job] = jobs("signup_completed")
    assert job.args["event"]["properties"]["signup_kind"] == "self_service"
  end

  test "business rollback also rolls back analytics", ctx do
    Repo.transaction(fn ->
      Analytics.register_account(ctx.account, %{})
      Repo.rollback(:failed)
    end)

    refute Repo.get(AccountState, ctx.account.id)
    assert jobs("signup_completed") == []
  end

  test "an invitation is not signup until accepted", ctx do
    Repo.transaction(fn -> Analytics.provision_account(ctx.account) end)
    assert Repo.get!(AccountState, ctx.account.id).signup_kind == :invitation
    assert jobs("signup_completed") == []
    Analytics.complete_invitation(ctx.account, %{})
    Analytics.complete_invitation(ctx.account, %{})
    [job] = jobs("signup_completed")
    assert job.args["event"]["properties"]["signup_kind"] == "invitation"
  end

  test "login creates missing analytics state without fabricating signup or attribution", ctx do
    Analytics.on_login(ctx.account, %{attribution: %{"utm_source" => "later"}, preference: "denied"})
    Analytics.on_login(ctx.account, %{})

    state = Repo.get!(AccountState, ctx.account.id)
    assert state.opted_out
    assert state.attribution == %{}
    assert state.signup_kind == nil
    assert state.completed_at == nil
    assert jobs("signup_completed") == []
  end

  test "login completes an invitation once and preserves its first attribution", ctx do
    Analytics.provision_account(ctx.account)
    Analytics.on_login(ctx.account, %{attribution: %{"utm_source" => "invite"}, channel: "web"})
    Analytics.on_login(ctx.account, %{attribution: %{"utm_source" => "later"}})

    state = Repo.get!(AccountState, ctx.account.id)
    assert state.completed_at
    assert state.attribution == %{"utm_source" => "invite"}
    [job] = jobs("signup_completed")
    assert job.args["event"]["properties"]["acquisition"] == state.attribution
  end

  test "login applies opt-out before completing invitation signup", ctx do
    Analytics.provision_account(ctx.account)
    Analytics.on_login(ctx.account, %{preference: "denied"})

    state = Repo.get!(AccountState, ctx.account.id)
    assert state.opted_out
    assert state.completed_at
    assert jobs("signup_completed") == []
  end

  test "login analytics rolls back with its transaction", ctx do
    Analytics.provision_account(ctx.account)

    Repo.transaction(fn ->
      Analytics.on_login(ctx.account, %{attribution: %{"utm_source" => "invite"}})
      Repo.rollback(:failed)
    end)

    assert Repo.get!(AccountState, ctx.account.id).completed_at == nil
    assert Repo.get!(AccountState, ctx.account.id).attribution == %{}
    assert jobs("signup_completed") == []
  end

  test "an existing account login cannot become a new signup", ctx do
    Analytics.complete_invitation(ctx.account, %{})
    assert jobs("signup_completed") == []
  end

  test "first real work activates once without a check-in", ctx do
    Repo.transaction(fn -> Analytics.workspace_created(ctx.company, ctx.account, %{}) end)
    Repo.transaction(fn -> Analytics.activate(ctx.company.id, ctx.account.id, %{}) end)
    Repo.transaction(fn -> Analytics.activate(ctx.company.id, ctx.account.id, %{}) end)
    assert Repo.aggregate(Activation, :count) == 1
    assert length(jobs("workspace_activated")) == 1
    assert jobs("goal_created") == []
  end

  test "seven-day boundary is exclusive", ctx do
    now = DateTime.utc_now()
    Repo.transaction(fn -> Analytics.workspace_created(ctx.company, ctx.account, %{}) end)
    state = Repo.get!(CompanyState, ctx.company.id)
    Repo.update!(Ecto.Changeset.change(state, created_at: DateTime.add(now, -168, :hour)))
    Repo.transaction(fn -> Analytics.activate(ctx.company.id, ctx.account.id, %{}, now) end)
    assert jobs("workspace_activated") == []
    Repo.update!(Ecto.Changeset.change(state, created_at: DateTime.add(now, -168 * 3600 + 1, :second)))
    Repo.transaction(fn -> Analytics.activate(ctx.company.id, ctx.account.id, %{}, now) end)
    assert length(jobs("workspace_activated")) == 1
  end

  test "opt-out is sticky and checked again at delivery", ctx do
    Repo.transaction(fn -> Analytics.register_account(ctx.account, %{}) end)
    [job] = jobs("signup_completed")
    Analytics.sync_account(ctx.account, %{preference: "denied"})
    Analytics.sync_account(ctx.account, %{})
    assert Repo.get!(AccountState, ctx.account.id).opted_out
    assert :ok = Delivery.perform(job)
    Analytics.sync_account(ctx.account, %{preference: "granted"})
    assert Repo.get!(AccountState, ctx.account.id).opted_out
  end

  test "disabled tracking stores and sends nothing", ctx do
    Application.put_env(:operately, :conversion_analytics, enabled: false)
    Analytics.on_login(ctx.account, %{})
    Repo.transaction(fn -> Analytics.register_account(ctx.account, %{}) end)
    Repo.transaction(fn -> Analytics.workspace_created(ctx.company, ctx.account, %{}) end)
    assert Repo.all(AccountState) == []
    assert Repo.all(CompanyState) == []
    assert jobs("signup_completed") == []
  end

  test "missing history stays unknown on workspace conversions", ctx do
    Analytics.sync_account(ctx.account, %{attribution: %{"utm_source" => "later"}})
    assert Repo.get!(AccountState, ctx.account.id).attribution == %{}

    Repo.transaction(fn ->
      Analytics.workspace_created(ctx.company, ctx.account, %{})
      Analytics.activate(ctx.company.id, ctx.account.id, %{})
    end)

    for event <- ["workspace_created", "workspace_activated"] do
      [job] = jobs(event)
      assert job.args["event"]["properties"]["acquisition"] == %{}
      assert job.args["event"]["properties"]["account_id"] == ctx.account.id
      assert job.args["event"]["properties"]["company_id"] == ctx.company.id
    end
  end

  test "after the deadline and historical companies cannot activate", ctx do
    Repo.transaction(fn -> Analytics.activate(ctx.company.id, ctx.account.id, %{}) end)
    assert Repo.all(Activation) == []
    Repo.transaction(fn -> Analytics.workspace_created(ctx.company, ctx.account, %{}) end)
    state = Repo.get!(CompanyState, ctx.company.id)
    now = DateTime.add(state.created_at, 168 * 3600 + 1, :second)
    Repo.transaction(fn -> Analytics.activate(ctx.company.id, ctx.account.id, %{}, now) end)
    assert Repo.all(Activation) == []
  end

  test "concurrent activation attempts create one record and one delivery", ctx do
    Repo.transaction(fn -> Analytics.workspace_created(ctx.company, ctx.account, %{}) end)

    1..5
    |> Task.async_stream(fn _ ->
      Oban.Testing.with_testing_mode(:manual, fn ->
        Repo.transaction(fn -> Analytics.activate(ctx.company.id, ctx.account.id, %{channel: "api"}) end)
      end)
    end)
    |> Enum.each(fn result -> assert {:ok, {:ok, :ok}} = result end)

    assert Repo.aggregate(Activation, :count) == 1
    assert length(jobs("workspace_activated")) == 1
  end

  test "a teammate activates with their identity and the creator's attribution", ctx do
    ctx = Factory.add_company_member(ctx, :teammate)

    Repo.transaction(fn ->
      Analytics.register_account(ctx.account, %{attribution: %{"utm_source" => "launch"}})
      Analytics.workspace_created(ctx.company, ctx.account, %{})
      Analytics.activate(ctx.company.id, ctx.teammate.account_id, %{channel: "mcp"})
    end)

    [job] = jobs("workspace_activated")
    event = job.args["event"]
    assert event["distinct_id"] == ctx.teammate.account_id
    assert event["properties"]["creator_account_id"] == ctx.account.id
    assert event["properties"]["acquisition"]["utm_source"] == "launch"
    assert event["properties"]["channel"] == "mcp"
  end

  defp jobs(event) do
    Repo.all(from j in Oban.Job, where: j.worker == "Operately.Analytics.Delivery")
    |> Enum.filter(&(&1.args["event"]["event"] == event))
  end
end

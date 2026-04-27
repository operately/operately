defmodule Operately.People.CliAuthSession do
  use Operately.Schema

  import Ecto.Query, warn: false

  alias Operately.Companies.Company
  alias Operately.People.{Account, ApiToken, CliAuthSession}
  alias Operately.Repo

  @valid_auth_methods [:password, :google]
  @valid_statuses [:pending, :authenticated, :failed, :consumed]
  @token_prefix "opbs_"
  @token_rand_size 32
  @token_ttl_seconds 10 * 60
  @poll_interval_ms 1_000
  @no_companies_reason "no_companies"

  schema "cli_auth_sessions" do
    belongs_to :account, Account

    field :token_hash, :binary
    field :auth_method, Ecto.Enum, values: @valid_auth_methods
    field :status, Ecto.Enum, values: @valid_statuses
    field :failure_reason, :string
    field :expires_at, :utc_datetime

    timestamps()
  end

  def changeset(session, attrs) do
    session
    |> cast(attrs, [:account_id, :token_hash, :auth_method, :status, :failure_reason, :expires_at])
    |> validate_required([:token_hash, :auth_method, :status, :expires_at])
    |> assoc_constraint(:account)
    |> unique_constraint(:token_hash)
  end

  def create_authenticated_session(%Account{} = account, auth_method \\ :password) when auth_method in @valid_auth_methods do
    {raw_token, token_hash} = build_bootstrap_token()

    %CliAuthSession{}
    |> changeset(%{
      account_id: account.id,
      token_hash: token_hash,
      auth_method: auth_method,
      status: :authenticated,
      expires_at: expires_at()
    })
    |> Repo.insert()
    |> case do
      {:ok, session} -> {:ok, session, raw_token}
      {:error, changeset} -> {:error, changeset}
    end
  end

  def create_pending_google_session do
    {raw_token, token_hash} = build_bootstrap_token()

    %CliAuthSession{}
    |> changeset(%{
      token_hash: token_hash,
      auth_method: :google,
      status: :pending,
      expires_at: expires_at()
    })
    |> Repo.insert()
    |> case do
      {:ok, session} -> {:ok, session, raw_token}
      {:error, changeset} -> {:error, changeset}
    end
  end

  def get_by_id(id) when is_binary(id) do
    with {:ok, id} <- Ecto.UUID.cast(id) do
      Repo.get(CliAuthSession, id)
    else
      :error -> nil
    end
  end

  def get_by_id(_), do: nil

  def authenticate(raw_token) when is_binary(raw_token) do
    raw_token = String.trim(raw_token)

    if raw_token == "" do
      {:error, :unauthorized}
    else
      token_hash = ApiToken.hash_token(raw_token)

      from(s in CliAuthSession,
        where: s.token_hash == ^token_hash,
        preload: [:account]
      )
      |> Repo.one()
      |> case do
        nil -> {:error, :unauthorized}
        session -> {:ok, session}
      end
    end
  end

  def authenticate(_), do: {:error, :unauthorized}

  def complete_google_auth(%CliAuthSession{} = session, %Account{} = account) do
    cond do
      consumed?(session) ->
        {:error, :consumed}

      expired?(session) ->
        {:error, :expired}

      session.status != :pending ->
        {:ok, session}

      eligible_companies(account) == [] ->
        session
        |> changeset(%{
          account_id: account.id,
          status: :failed,
          failure_reason: @no_companies_reason
        })
        |> Repo.update()

      true ->
        session
        |> changeset(%{
          account_id: account.id,
          status: :authenticated,
          failure_reason: nil
        })
        |> Repo.update()
    end
  end

  def eligible_companies(%Account{} = account) do
    Repo.all(
      from(c in Company,
        join: p in assoc(c, :people),
        where: p.account_id == ^account.id and p.suspended == false and is_nil(p.suspended_at),
        distinct: c.id
      )
    )
  end

  def poll_interval_ms, do: @poll_interval_ms
  def no_companies_message, do: "This account is not a member of any companies. Join a company in the browser before using the CLI."
  def expired_message, do: "This authentication session has expired. Please start again from the CLI."
  def no_companies_reason, do: @no_companies_reason

  def expired?(%CliAuthSession{} = session) do
    DateTime.compare(session.expires_at, DateTime.utc_now() |> DateTime.truncate(:second)) != :gt
  end

  def expired?(_), do: true

  def consumed?(%CliAuthSession{status: :consumed}), do: true
  def consumed?(_), do: false

  def no_companies?(%CliAuthSession{status: :failed, failure_reason: @no_companies_reason}), do: true
  def no_companies?(_), do: false

  defp build_bootstrap_token do
    raw_token =
      @token_prefix <>
        (:crypto.strong_rand_bytes(@token_rand_size)
         |> Base.url_encode64(padding: false))

    {raw_token, ApiToken.hash_token(raw_token)}
  end

  defp expires_at do
    DateTime.utc_now()
    |> DateTime.truncate(:second)
    |> DateTime.add(@token_ttl_seconds, :second)
  end
end

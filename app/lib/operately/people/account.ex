defmodule Operately.People.Account do
  use Operately.Schema
  use Operately.Repo.Getter

  @valid_themes [:dark, :light, :system]

  schema "accounts" do
    has_many :people, Operately.People.Person, foreign_key: :account_id

    field :full_name, :string
    field :email, :string
    field :password, :string, virtual: true, redact: true
    field :hashed_password, :string, redact: true
    field :confirmed_at, :naive_datetime
    field :first_login_at, :utc_datetime
    field :site_admin, :boolean, default: false
    field :theme, Ecto.Enum, values: @valid_themes, default: :system

    request_info()
    soft_delete()
    timestamps()
  end

  def create(full_name, email, password, analytics_context \\ %{}) do
    create_with_changeset(registration_changeset(%{full_name: full_name, email: email, password: password}), analytics_context)
  end

  def create_signup(changeset, analytics_context) do
    create_with_changeset(maybe_hash_password(changeset, []), analytics_context)
  end

  defp create_with_changeset(changeset, analytics_context) do
    Ecto.Multi.new()
    |> Ecto.Multi.insert(:account, changeset)
    |> Operately.Analytics.enqueue_step(:analytics_signup, fn %{account: account} -> Operately.Analytics.register_account(account, analytics_context) end)
    |> Oban.insert(:send_onboarding_email, fn %{account: account} -> OperatelyEE.AccountOnboardingJob.new(%{account_id: account.id}) end)
    |> Repo.transaction()
    |> Repo.extract_result(:account)
  end

  def registration_changeset(attrs) do
    registration_changeset(%__MODULE__{}, attrs)
  end

  def changeset(account, attrs) do
    account
    |> cast(attrs, [:theme])
  end

  def registration_changeset(account, attrs, opts \\ []) do
    account
    |> cast(attrs, [:email, :password, :full_name])
    |> validate_email(opts)
    |> validate_required([:full_name])
    |> validate_password(opts)
  end

  # Email signup is intentionally stricter than generated/internal credentials.
  # This changeset performs no hashing, writes, or job creation.
  def signup_changeset(attrs) do
    %__MODULE__{}
    |> cast(attrs, [:email, :full_name, :password])
    |> update_change(:email, &normalize_email/1)
    |> update_change(:full_name, &trim_name/1)
    |> validate_signup_email()
    |> maybe_validate_unique_email(repo_opts: [with_deleted: true])
    |> validate_required([:full_name, :password])
    |> validate_length(:full_name, max: 255, count: :codepoints)
    |> validate_length(:password, max: 72, count: :bytes)
    |> validate_change(:password, fn :password, password ->
      units = byte_size(:unicode.characters_to_binary(password, :utf8, {:utf16, :big})) / 2

      if units >= 12 and Regex.match?(~r/[A-Z]/, password) and Regex.match?(~r/[a-z]/, password) and Regex.match?(~r/[0-9]/, password) do
        []
      else
        [password: {"does not meet signup requirements", [validation: :signup_password]}]
      end
    end)
  end

  def normalize_email(email) when is_binary(email), do: email |> String.trim() |> String.downcase()
  def normalize_email(email), do: email

  defp trim_name(name) when is_binary(name), do: String.trim(name)
  defp trim_name(name), do: name

  defp validate_signup_email(changeset) do
    changeset
    |> validate_required([:email])
    |> validate_format(:email, ~r/\A[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)+\z/u)
    |> validate_length(:email, max: 255, count: :codepoints)
  end

  defp validate_email(changeset, opts) do
    changeset
    |> validate_required([:email])
    |> validate_format(:email, ~r/^[^\s]+@[^\s]+$/, message: "must have the @ sign and no spaces")
    |> validate_length(:email, max: 160)
    |> maybe_validate_unique_email(opts)
  end

  defp validate_password(changeset, opts) do
    changeset
    |> validate_required([:password])
    |> validate_length(:password, min: 12, max: 72)
    |> validate_length(:password, max: 72, count: :bytes)
    |> maybe_hash_password(opts)
  end

  defp maybe_hash_password(changeset, opts) do
    hash_password? = Keyword.get(opts, :hash_password, true)
    password = get_change(changeset, :password)

    if hash_password? && password && changeset.valid? do
      changeset
      # Hashing could be done with `Ecto.Changeset.prepare_changes/2`, but that
      # would keep the database transaction open longer and hurt performance.
      |> put_change(:hashed_password, Bcrypt.hash_pwd_salt(password))
      |> delete_change(:password)
    else
      changeset
    end
  end

  defp maybe_validate_unique_email(changeset, opts) do
    if Keyword.get(opts, :validate_email, true) do
      changeset
      |> unsafe_validate_unique(:email, Operately.Repo, repo_opts: Keyword.get(opts, :repo_opts, []))
      |> unique_constraint(:email)
    else
      changeset
    end
  end

  def email_changeset(account, attrs, opts \\ []) do
    account
    |> cast(attrs, [:email])
    |> validate_email(opts)
    |> case do
      %{changes: %{email: _}} = changeset -> changeset
      %{} = changeset -> add_error(changeset, :email, "did not change")
    end
  end

  def password_changeset(account, attrs, opts \\ []) do
    account
    |> cast(attrs, [:password])
    |> validate_confirmation(:password, message: "does not match password")
    |> validate_password(opts)
  end

  @doc """
  Confirms the account by setting `confirmed_at`.
  """
  def confirm_changeset(account) do
    now = NaiveDateTime.utc_now() |> NaiveDateTime.truncate(:second)
    change(account, confirmed_at: now)
  end

  def promote_to_admin(account) do
    account
    |> change(site_admin: true)
    |> Operately.Repo.update()
  end

  def demote_from_admin(account) do
    account
    |> change(site_admin: false)
    |> Operately.Repo.update()
  end

  def is_site_admin?(account) do
    account.site_admin
  end

  def deleted?(%__MODULE__{deleted_at: nil}), do: false
  def deleted?(%__MODULE__{}), do: true

  @doc """
  Verifies the password.

  If there is no account or the account doesn't have a password, we call
  `Bcrypt.no_user_verify/0` to avoid timing attacks.
  """
  def valid_password?(%Operately.People.Account{hashed_password: hashed_password}, password) when is_binary(hashed_password) and byte_size(password) > 0 do
    Bcrypt.verify_pass(password, hashed_password)
  end

  def valid_password?(_, _) do
    Bcrypt.no_user_verify()
    false
  end

  @doc """
  Validates the current password otherwise adds an error to the changeset.
  """
  def validate_current_password(changeset, password) do
    if valid_password?(changeset.data, password) do
      changeset
    else
      add_error(changeset, :current_password, "is not valid")
    end
  end

  def valid_themes(), do: @valid_themes
end

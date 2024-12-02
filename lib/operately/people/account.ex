defmodule Operately.People.Account do
  use Operately.Schema
  use Operately.Repo.Getter

  schema "accounts" do
    has_many :people, Operately.People.Person, foreign_key: :account_id

    field :full_name, :string
    field :email, :string
    field :password, :string, virtual: true, redact: true
    field :hashed_password, :string, redact: true
    field :confirmed_at, :naive_datetime
    field :site_admin, :boolean, default: false

    request_info()
    timestamps()
  end

  def create(full_name, email, password) do
    Ecto.Multi.new()
    |> Ecto.Multi.insert(:account, registration_changeset(%{full_name: full_name, email: email, password: password}))
    |> Oban.insert(:send_onboarding_email, fn %{account: account} -> OperatelyEE.AccountOnboardingJob.new(%{account_id: account.id}) end)
    |> Repo.transaction()
  end

  def registration_changeset(attrs) do
    registration_changeset(%__MODULE__{}, attrs)
  end

  def registration_changeset(account, attrs, opts \\ []) do
    account
    |> cast(attrs, [:email, :password, :full_name])
    |> validate_email(opts)
    |> validate_password(opts)
    |> validate_required([:full_name])
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
    |> maybe_hash_password(opts)
  end

  defp maybe_hash_password(changeset, opts) do
    hash_password? = Keyword.get(opts, :hash_password, true)
    password = get_change(changeset, :password)

    if hash_password? && password && changeset.valid? do
      changeset
      # If using Bcrypt, then further validate it is at most 72 bytes long
      |> validate_length(:password, max: 72, count: :bytes)
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
      |> unsafe_validate_unique(:email, Operately.Repo)
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
end

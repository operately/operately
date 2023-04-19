defmodule Operately.People do
  @moduledoc """
  The People context.
  """

  import Ecto.Query, warn: false
  alias Operately.Repo

  alias Operately.People.Person

  @doc """
  Returns the list of people.

  ## Examples

      iex> list_people()
      [%Person{}, ...]

  """
  def list_people do
    Repo.all(Person)
  end

  @doc """
  Gets a single person.

  Raises `Ecto.NoResultsError` if the Person does not exist.

  ## Examples

      iex> get_person!(123)
      %Person{}

      iex> get_person!(456)
      ** (Ecto.NoResultsError)

  """
  def get_person!(id), do: Repo.get!(Person, id)

  @doc """
  Gets the first person with the given name.

  Raises `Ecto.NoResultsError` if the Person does not exist.

  ## Examples

      iex> get_person_by_name!("John Johnson")
      %Person{}

      iex> get_person_by_name!("John Doe")
      ** (Ecto.NoResultsError)

  """
  def get_person_by_name!(name) do
    Repo.one!(from p in Person, where: p.full_name == ^name)
  end

  @doc """
  Creates a person.

  ## Examples

      iex> create_person(%{field: value})
      {:ok, %Person{}}

      iex> create_person(%{field: bad_value})
      {:error, %Ecto.Changeset{}}

  """
  def create_person(attrs \\ %{}) do
    %Person{}
    |> Person.changeset(attrs)
    |> Repo.insert()
  end

  @doc """
  Updates a person.

  ## Examples

      iex> update_person(person, %{field: new_value})
      {:ok, %Person{}}

      iex> update_person(person, %{field: bad_value})
      {:error, %Ecto.Changeset{}}

  """
  def update_person(%Person{} = person, attrs) do
    person
    |> Person.changeset(attrs)
    |> Repo.update()
  end

  @doc """
  Deletes a person.

  ## Examples

      iex> delete_person(person)
      {:ok, %Person{}}

      iex> delete_person(person)
      {:error, %Ecto.Changeset{}}

  """
  def delete_person(%Person{} = person) do
    Repo.delete(person)
  end

  @doc """
  Returns an `%Ecto.Changeset{}` for tracking person changes.

  ## Examples

      iex> change_person(person)
      %Ecto.Changeset{data: %Person{}}

  """
  def change_person(%Person{} = person, attrs \\ %{}) do
    Person.changeset(person, attrs)
  end

  alias Operately.People.{Account, AccountToken, AccountNotifier}

  ## Database getters

  @doc """
  Gets a account by email.

  ## Examples

      iex> get_account_by_email("foo@example.com")
      %Account{}

      iex> get_account_by_email("unknown@example.com")
      nil

  """
  def get_account_by_email(email) when is_binary(email) do
    Repo.get_by(Account, email: email)
  end

  @doc """
  Gets a account by email and password.

  ## Examples

      iex> get_account_by_email_and_password("foo@example.com", "correct_password")
      %Account{}

      iex> get_account_by_email_and_password("foo@example.com", "invalid_password")
      nil

  """
  def get_account_by_email_and_password(email, password)
      when is_binary(email) and is_binary(password) do
    account = Repo.get_by(Account, email: email)
    if Account.valid_password?(account, password), do: account
  end

  @doc """
  Gets a single account.

  Raises `Ecto.NoResultsError` if the Account does not exist.

  ## Examples

      iex> get_account!(123)
      %Account{}

      iex> get_account!(456)
      ** (Ecto.NoResultsError)

  """
  def get_account!(id), do: Repo.get!(Account, id)

  ## Account registration

  @doc """
  Registers a account.

  ## Examples

      iex> register_account(%{field: value})
      {:ok, %Account{}}

      iex> register_account(%{field: bad_value})
      {:error, %Ecto.Changeset{}}

  """
  def register_account(attrs) do
    %Account{}
    |> Account.registration_changeset(attrs)
    |> Repo.insert()
  end

  @doc """
  Returns an `%Ecto.Changeset{}` for tracking account changes.

  ## Examples

      iex> change_account_registration(account)
      %Ecto.Changeset{data: %Account{}}

  """
  def change_account_registration(%Account{} = account, attrs \\ %{}) do
    Account.registration_changeset(account, attrs, hash_password: false, validate_email: false)
  end

  ## Settings

  @doc """
  Returns an `%Ecto.Changeset{}` for changing the account email.

  ## Examples

      iex> change_account_email(account)
      %Ecto.Changeset{data: %Account{}}

  """
  def change_account_email(account, attrs \\ %{}) do
    Account.email_changeset(account, attrs, validate_email: false)
  end

  @doc """
  Emulates that the email will change without actually changing
  it in the database.

  ## Examples

      iex> apply_account_email(account, "valid password", %{email: ...})
      {:ok, %Account{}}

      iex> apply_account_email(account, "invalid password", %{email: ...})
      {:error, %Ecto.Changeset{}}

  """
  def apply_account_email(account, password, attrs) do
    account
    |> Account.email_changeset(attrs)
    |> Account.validate_current_password(password)
    |> Ecto.Changeset.apply_action(:update)
  end

  @doc """
  Updates the account email using the given token.

  If the token matches, the account email is updated and the token is deleted.
  The confirmed_at date is also updated to the current time.
  """
  def update_account_email(account, token) do
    context = "change:#{account.email}"

    with {:ok, query} <- AccountToken.verify_change_email_token_query(token, context),
         %AccountToken{sent_to: email} <- Repo.one(query),
         {:ok, _} <- Repo.transaction(account_email_multi(account, email, context)) do
      :ok
    else
      _ -> :error
    end
  end

  defp account_email_multi(account, email, context) do
    changeset =
      account
      |> Account.email_changeset(%{email: email})
      |> Account.confirm_changeset()

    Ecto.Multi.new()
    |> Ecto.Multi.update(:account, changeset)
    |> Ecto.Multi.delete_all(:tokens, AccountToken.account_and_contexts_query(account, [context]))
  end

  @doc ~S"""
  Delivers the update email instructions to the given account.

  ## Examples

      iex> deliver_account_update_email_instructions(account, current_email, &url(~p"/accounts/settings/confirm_email/#{&1})")
      {:ok, %{to: ..., body: ...}}

  """
  def deliver_account_update_email_instructions(%Account{} = account, current_email, update_email_url_fun)
      when is_function(update_email_url_fun, 1) do
    {encoded_token, account_token} = AccountToken.build_email_token(account, "change:#{current_email}")

    Repo.insert!(account_token)
    AccountNotifier.deliver_update_email_instructions(account, update_email_url_fun.(encoded_token))
  end

  @doc """
  Returns an `%Ecto.Changeset{}` for changing the account password.

  ## Examples

      iex> change_account_password(account)
      %Ecto.Changeset{data: %Account{}}

  """
  def change_account_password(account, attrs \\ %{}) do
    Account.password_changeset(account, attrs, hash_password: false)
  end

  @doc """
  Updates the account password.

  ## Examples

      iex> update_account_password(account, "valid password", %{password: ...})
      {:ok, %Account{}}

      iex> update_account_password(account, "invalid password", %{password: ...})
      {:error, %Ecto.Changeset{}}

  """
  def update_account_password(account, password, attrs) do
    changeset =
      account
      |> Account.password_changeset(attrs)
      |> Account.validate_current_password(password)

    Ecto.Multi.new()
    |> Ecto.Multi.update(:account, changeset)
    |> Ecto.Multi.delete_all(:tokens, AccountToken.account_and_contexts_query(account, :all))
    |> Repo.transaction()
    |> case do
      {:ok, %{account: account}} -> {:ok, account}
      {:error, :account, changeset, _} -> {:error, changeset}
    end
  end

  ## Session

  @doc """
  Generates a session token.
  """
  def generate_account_session_token(account) do
    {token, account_token} = AccountToken.build_session_token(account)
    Repo.insert!(account_token)
    token
  end

  @doc """
  Gets the account with the given signed token.
  """
  def get_account_by_session_token(token) do
    {:ok, query} = AccountToken.verify_session_token_query(token)
    Repo.one(query)
  end

  @doc """
  Deletes the signed token with the given context.
  """
  def delete_account_session_token(token) do
    Repo.delete_all(AccountToken.token_and_context_query(token, "session"))
    :ok
  end

  ## Confirmation

  @doc ~S"""
  Delivers the confirmation email instructions to the given account.

  ## Examples

      iex> deliver_account_confirmation_instructions(account, &url(~p"/accounts/confirm/#{&1}"))
      {:ok, %{to: ..., body: ...}}

      iex> deliver_account_confirmation_instructions(confirmed_account, &url(~p"/accounts/confirm/#{&1}"))
      {:error, :already_confirmed}

  """
  def deliver_account_confirmation_instructions(%Account{} = account, confirmation_url_fun)
      when is_function(confirmation_url_fun, 1) do
    if account.confirmed_at do
      {:error, :already_confirmed}
    else
      {encoded_token, account_token} = AccountToken.build_email_token(account, "confirm")
      Repo.insert!(account_token)
      AccountNotifier.deliver_confirmation_instructions(account, confirmation_url_fun.(encoded_token))
    end
  end

  @doc """
  Confirms a account by the given token.

  If the token matches, the account account is marked as confirmed
  and the token is deleted.
  """
  def confirm_account(token) do
    with {:ok, query} <- AccountToken.verify_email_token_query(token, "confirm"),
         %Account{} = account <- Repo.one(query),
         {:ok, %{account: account}} <- Repo.transaction(confirm_account_multi(account)) do
      {:ok, account}
    else
      _ -> :error
    end
  end

  defp confirm_account_multi(account) do
    Ecto.Multi.new()
    |> Ecto.Multi.update(:account, Account.confirm_changeset(account))
    |> Ecto.Multi.delete_all(:tokens, AccountToken.account_and_contexts_query(account, ["confirm"]))
  end

  ## Reset password

  @doc ~S"""
  Delivers the reset password email to the given account.

  ## Examples

      iex> deliver_account_reset_password_instructions(account, &url(~p"/accounts/reset_password/#{&1}"))
      {:ok, %{to: ..., body: ...}}

  """
  def deliver_account_reset_password_instructions(%Account{} = account, reset_password_url_fun)
      when is_function(reset_password_url_fun, 1) do
    {encoded_token, account_token} = AccountToken.build_email_token(account, "reset_password")
    Repo.insert!(account_token)
    AccountNotifier.deliver_reset_password_instructions(account, reset_password_url_fun.(encoded_token))
  end

  @doc """
  Gets the account by reset password token.

  ## Examples

      iex> get_account_by_reset_password_token("validtoken")
      %Account{}

      iex> get_account_by_reset_password_token("invalidtoken")
      nil

  """
  def get_account_by_reset_password_token(token) do
    with {:ok, query} <- AccountToken.verify_email_token_query(token, "reset_password"),
         %Account{} = account <- Repo.one(query) do
      account
    else
      _ -> nil
    end
  end

  @doc """
  Resets the account password.

  ## Examples

      iex> reset_account_password(account, %{password: "new long password", password_confirmation: "new long password"})
      {:ok, %Account{}}

      iex> reset_account_password(account, %{password: "valid", password_confirmation: "not the same"})
      {:error, %Ecto.Changeset{}}

  """
  def reset_account_password(account, attrs) do
    Ecto.Multi.new()
    |> Ecto.Multi.update(:account, Account.password_changeset(account, attrs))
    |> Ecto.Multi.delete_all(:tokens, AccountToken.account_and_contexts_query(account, :all))
    |> Repo.transaction()
    |> case do
      {:ok, %{account: account}} -> {:ok, account}
      {:error, :account, changeset, _} -> {:error, changeset}
    end
  end

  @doc """
  Fetch an existing account by email, or create a new one based on the given attributes.

  ## Examples

      iex> get_or_create_account(%{email: "test@tester.com"})
      {:ok, %Account{}}
  """
  def fetch_or_create_account(attrs) do
    get_account_by_email(attrs.email)
    |> case do
      %Account{} = account -> {:ok, account}
      _ -> create_account(attrs)
    end
    |> case do
      {:ok, account} -> find_or_create_person_for_account(account, attrs)
      {:error, changeset} -> {:error, changeset}
    end
  end

  defp create_account(attrs) do
    %Account{}
    |> Account.registration_changeset(attrs)
    |> Repo.insert()
  end

  defp find_or_create_person_for_account(account, attrs) do
    account = Repo.preload(account, [:person])

    if account.person do
      {:ok, account}
    else
      person_attrs = Map.merge(attrs.person, %{account_id: account.id})

      case create_person(person_attrs) do
        {:ok, _} -> {:ok, Repo.preload(account, [:person])}
        e -> e
      end
    end
  end

  def search_people(query) do
    Repo.all(
      from p in Person,
      where: ilike(p.full_name, ^"%#{query}%") or ilike(p.title, ^"%#{query}%")
    )
  end
end

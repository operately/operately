defmodule Operately.People do
  import Ecto.Query, warn: false

  alias Ecto.Multi
  alias Operately.Repo
  alias Operately.Access
  alias Operately.Companies
  alias Operately.Companies.Company
  alias Operately.People.{Person, Account}
  alias Operately.Access.Binding
  alias Operately.Access.Fetch
  alias Operately.People.Account
  alias Operately.People.AccountToken

  def list_people(company_id) when is_binary(company_id) do
    Repo.all(from p in Person, where: p.company_id == ^company_id and not p.suspended)
  end

  def list_agents(company_id) do
    Repo.all(from p in Person, where: p.company_id == ^company_id and p.type == :ai and not p.suspended)
  end

  def get_account!(id), do: Repo.get!(Account, id)
  def get_person(id), do: Repo.get(Person, id)
  def get_person!(id), do: Repo.get!(Person, id)

  def get_person(account = %Account{}, company = %Company{}) do
    Repo.one(from p in Person, where: p.account_id == ^account.id and p.company_id == ^company.id)
  end

  def get_person!(account = %Account{}, company = %Company{}) do
    Repo.one!(from p in Person, where: p.account_id == ^account.id and p.company_id == ^company.id)
  end

  def get_agent_def(%Person{} = person) do
    Repo.get_by(Operately.People.AgentDef, person_id: person.id)
  end

  def get_person_with_access_level(person_id, requester_id) do
    if person_id == requester_id do
      person = Repo.one!(from p in Person, where: p.id == ^person_id)
      person = Person.set_requester_access_level(person, Binding.full_access())
      {:ok, person}
    else
      from(p in Person, as: :resource, where: p.id == ^person_id)
      |> Fetch.get_resource_with_access_level(requester_id)
    end
  end

  def get_person_by_name!(company = %Company{}, name) do
    Repo.one!(from p in Person, where: p.full_name == ^name and p.company_id == ^company.id)
  end

  def get_person_by_email(company, email) do
    Repo.one(from p in Person, where: p.email == ^email and p.company_id == ^company.id)
  end

  def get_account_by_email(email) when is_binary(email) do
    Repo.one(from a in Account, where: a.email == ^email)
  end

  def get_account_by_email_and_password(email, password) when is_binary(email) and is_binary(password) do
    account = Repo.get_by(Operately.People.Account, email: email)
    if Operately.People.Account.valid_password?(account, password), do: account
  end

  def is_new_account?(email) when is_binary(email) do
    not Repo.exists?(
      from(a in Account,
        join: p in assoc(a, :people),
        where: a.email == ^email,
        where: not p.has_open_invitation
      )
    )
  end

  defdelegate insert_person(multi, callback), to: Operately.People.InsertPersonIntoOperation, as: :insert

  def create_person(attrs \\ %{}) do
    Multi.new()
    |> Multi.insert(:person, Person.changeset(%Person{}, attrs))
    |> Multi.run(:group, fn _, %{person: person} ->
      Access.create_group(%{person_id: person.id})
    end)
    |> Multi.run(:self_membership, fn _, %{person: person, group: group} ->
      Access.create_group_membership(%{group_id: group.id, person_id: person.id})
    end)
    |> Multi.run(:company_membership, fn _, %{person: person} ->
      company_group = Access.get_group(company_id: person.company_id, tag: :standard)
      Access.create_group_membership(%{group_id: company_group.id, person_id: person.id})
    end)
    |> Multi.run(:add_to_general_space, fn _, %{person: person} ->
      Companies.add_person_to_general_space(person)
    end)
    |> Repo.transaction()
    |> case do
      {:ok, %{person: person}} -> {:ok, person}
      {:error, :person, changeset, _} -> {:error, changeset}
      error -> error
    end
  end

  def update_person(%Person{} = person, attrs) do
    person
    |> Person.changeset(attrs)
    |> Repo.update()
  end

  def get_manager(%Person{} = person) do
    if person.manager_id == nil do
      nil
    else
      Repo.get_by(Person, id: person.manager_id)
    end
  end

  def get_reports(%Person{} = person) do
    Repo.all(from p in Person, where: p.manager_id == ^person.id and not p.suspended)
  end

  def get_peers(%Person{} = person) do
    if person.manager_id == nil do
      Repo.all(from p in Person, where: is_nil(p.manager_id) and p.id != ^person.id and not p.suspended and p.company_id == ^person.company_id)
    else
      Repo.all(from p in Person, where: p.manager_id == ^person.manager_id and p.id != ^person.id and not p.suspended and p.company_id == ^person.company_id)
    end
  end

  def change_person(%Person{} = person, attrs \\ %{}) do
    Person.changeset(person, attrs)
  end

  def register_account(attrs) do
    %Account{}
    |> Account.registration_changeset(attrs)
    |> Repo.insert()
  end

  def change_account_registration(%Account{} = account, attrs \\ %{}) do
    Account.registration_changeset(account, attrs, hash_password: false, validate_email: false)
  end

  def change_account_email(account, attrs \\ %{}) do
    Account.email_changeset(account, attrs, validate_email: false)
  end

  def update_theme(%Account{} = account, theme) do
    account
    |> Account.changeset(%{theme: theme})
    |> Repo.update()
  end

  def apply_account_email(account, password, attrs) do
    account
    |> Account.email_changeset(attrs)
    |> Account.validate_current_password(password)
    |> Ecto.Changeset.apply_action(:update)
  end

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

  def change_account_password(account, attrs \\ %{}) do
    Account.password_changeset(account, attrs, hash_password: false)
  end

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

  def generate_account_session_token(account) do
    {token, account_token} = AccountToken.build_session_token(account)
    Repo.insert!(account_token)
    token
  end

  def get_account_by_session_token(token) do
    {:ok, query} = AccountToken.verify_session_token_query(token)

    Repo.one(query)
  end

  def delete_account_session_token(token) do
    Repo.delete_all(AccountToken.token_and_context_query(token, "session"))
    :ok
  end

  def get_account_by_reset_password_token(token) do
    with {:ok, query} <- AccountToken.verify_email_token_query(token, "reset_password"),
         %Account{} = account <- Repo.one(query) do
      account
    else
      _ -> nil
    end
  end

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

  def find_or_create_account(attrs) do
    Operately.People.FetchOrCreateAccountOperation.call(attrs)
  end
end

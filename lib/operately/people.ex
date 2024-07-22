defmodule Operately.People do
  import Ecto.Query, warn: false
  alias Ecto.Multi
  alias Operately.Repo

  alias Operately.Access
  alias Operately.People.{Person, Account}

  def list_people(company_id) do
    Repo.all(from p in Person, where: p.company_id == ^company_id and not p.suspended)
  end

  def get_account!(id), do: Repo.get!(Account, id)
  def get_person!(id), do: Repo.get!(Person, id)

  def get_person_by_name!(company, name) do
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

  def insert_person(multi, callback) when is_function(callback, 1) do
    multi
    |> Multi.insert(:person, fn changes -> callback.(changes) end)
    |> insert_person_access_group()
  end

  defp insert_person_access_group(multi) do
    multi
    |> Multi.insert(:person_access_group, fn changes ->
      Access.Group.changeset(%{person_id: changes.person.id})
    end)
    |> Multi.insert(:person_access_membership, fn changes ->
      Access.GroupMembership.changeset(%{
        group_id: changes.person_access_group.id,
        person_id: changes.person.id,
      })
    end)
  end

  def create_person(attrs \\ %{}) do
    changeset = Person.changeset(%Person{}, attrs)

    with {:ok, person} <- Repo.insert(changeset),
         {:ok, group} <- Access.create_group(%{person_id: person.id}),
         {:ok, _} <- Access.create_group_membership(%{group_id: group.id, person_id: person.id}),
         company_group <- Access.get_group(company_id: person.company_id, tag: :standard),
         {:ok, _} <- Access.create_group_membership(%{ group_id: company_group.id, person_id: person.id }) do
      {:ok, person}
    else
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

  alias Operately.People.{Account, AccountToken, AccountNotifier}


  # def get_account!(id), do: Repo.get!(Account, id)

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

  def deliver_account_update_email_instructions(%Account{} = account, current_email, update_email_url_fun)
      when is_function(update_email_url_fun, 1) do
    {encoded_token, account_token} = AccountToken.build_email_token(account, "change:#{current_email}")

    Repo.insert!(account_token)
    AccountNotifier.deliver_update_email_instructions(account, update_email_url_fun.(encoded_token))
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

    case Repo.one(query) do
      %Account{} = account ->
        Repo.preload(account, [:person])
      nil ->
        nil
    end
  end

  def delete_account_session_token(token) do
    Repo.delete_all(AccountToken.token_and_context_query(token, "session"))
    :ok
  end

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

  def deliver_account_reset_password_instructions(%Account{} = account, reset_password_url_fun)
      when is_function(reset_password_url_fun, 1) do
    {encoded_token, account_token} = AccountToken.build_email_token(account, "reset_password")
    Repo.insert!(account_token)
    AccountNotifier.deliver_reset_password_instructions(account, reset_password_url_fun.(encoded_token))
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

  def find_or_create_account(company, attrs) do
    Operately.People.FetchOrCreateAccountOperation.call(company, attrs)
  end

  def get_assignments(person, time_range_start, time_range_end) do
    alias Operately.Projects.Project
    alias Operately.Projects.Milestone

    projects = Repo.all(
      from p in Project,
        join: a in assoc(p, :contributors),
        where: a.person_id == ^person.id and a.role == :champion
    )

    milestones = Repo.all(
      from m in Milestone,
        where: m.project_id in ^(Enum.map(projects, & &1.id)),
        where: not is_nil(m.deadline_at),
        where: m.deadline_at > ^time_range_start,
        where: m.deadline_at < ^time_range_end,
        where: m.status == :pending
    )

    pending_status_updates = Repo.all(
      from p in Project,
        where: p.id in ^(Enum.map(projects, & &1.id)),
        where: not is_nil(p.next_update_scheduled_at),
        where: p.next_update_scheduled_at > ^time_range_start,
        where: p.next_update_scheduled_at < ^time_range_end
    )

    assignments = []
      ++ Enum.map(milestones, fn milestone ->
        %{
          type: "milestone",
          due: milestone.deadline_at,
          resource: milestone
        }
      end)
        ++ Enum.map(pending_status_updates, fn project_status_update ->
          %{
            type: "project_status_update",
            due: project_status_update.next_update_scheduled_at,
            resource: project_status_update
          }
        end)

    Enum.sort_by(assignments, & &1.due)
  end

  def get_theme(%Person{} = person) do
    person.theme || "system"
  end

end

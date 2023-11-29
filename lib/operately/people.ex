defmodule Operately.People do
  @moduledoc """
  The People context.
  """

  import Ecto.Query, warn: false
  alias Operately.Repo

  alias Operately.People.Person

  def list_people do
    Repo.all(Person)
  end

  def list_people(company_id) do
    Repo.all(from p in Person, where: p.company_id == ^company_id)
  end

  def get_person!(id), do: Repo.get!(Person, id)

  def get_person_by_name!(name) do
    Repo.one!(from p in Person, where: p.full_name == ^name)
  end

  def get_person_by_email(email) do
    Repo.one(from p in Person, where: p.email == ^email)
  end

  def create_person(attrs \\ %{}) do
    %Person{}
    |> Person.changeset(attrs)
    |> Repo.insert()
  end

  def update_person(%Person{} = person, attrs) do
    person
    |> Person.changeset(attrs)
    |> Repo.update()
  end

  def delete_person(%Person{} = person) do
    Repo.delete(person)
  end

  def change_person(%Person{} = person, attrs \\ %{}) do
    Person.changeset(person, attrs)
  end

  alias Operately.People.{Account, AccountToken, AccountNotifier}

  def get_account_by_email(email) when is_binary(email) do
    Repo.get_by(Account, email: email)
  end

  def get_account_by_email_and_password(email, password)
      when is_binary(email) and is_binary(password) do
    account = Repo.get_by(Account, email: email)
    if Account.valid_password?(account, password), do: account
  end

  def get_account!(id), do: Repo.get!(Account, id)

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

  def log_in_or_create_account(attrs) do
    Operately.People.FetchOrCreateAccountOperation.call(attrs)
  end

  def fetch_or_create_account(attrs) do
    restrict_entry!(attrs.email)

    get_account_by_email(attrs.email)
    |> case do
      %Account{} = account -> 
        {:ok, account}
      _ -> create_account(attrs)
    end
    |> case do
      {:ok, account} -> find_or_create_person_for_account(account, attrs)
      {:error, changeset} -> {:error, changeset}
    end
  end

  defp restrict_entry!(email) do
    if Application.get_env(:operately, :restrict_entry) do
      allowed = String.split(System.get_env("ALLOWED_EMAILS"), ",")

      if email not in allowed do
        raise "Not allowed"
      end
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

  def search_people(query, limit \\ 5) do
    Repo.all(
      from p in Person,
      where: ilike(p.full_name, ^"%#{query}%") or ilike(p.title, ^"%#{query}%"),
      limit: ^limit
    )
  end

  alias Operately.Dashboards

  def find_or_create_home_dashboard(person) do
    person = get_person!(person.id)
    person = Repo.preload(person, [:home_dashboard])

    if person.home_dashboard do
      {:ok, person.home_dashboard}
    else
      create_home_dashboard(person)
    end
  end

  defp create_home_dashboard(person) do
    Repo.transaction(fn ->
      case Dashboards.create_dashboard(%{company_id: person.company_id}) do
        {:ok, dashboard} ->
          {:ok, _person} = update_person(person, %{home_dashboard_id: dashboard.id})

          {:ok, _} = Dashboards.create_panel(%{
            dashboard_id: dashboard.id,
            index: 0,
            type: "account"
          })

          {:ok, _} = Dashboards.create_panel(%{
            dashboard_id: dashboard.id,
            index: 1,
            type: "my-assignments"
          })

          # {:ok, _} = Dashboards.create_panel(%{
          #   dashboard_id: dashboard.id,
          #   index: 2,
          #   type: "activity"
          # })

          # {:ok, _} = Dashboards.create_panel(%{
          #   dashboard_id: dashboard.id,
          #   index: 3,
          #   type: "my-projects"
          # })

          dashboard
        {:error, changeset} -> 
          {:error, changeset}
      end
    end)
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

end

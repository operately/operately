defmodule Operately.Operations.AccountDeleting do
  import Ecto.Query

  alias Ecto.Multi
  alias Operately.Companies
  alias Operately.People.Account
  alias Operately.People.AccountToken
  alias Operately.People.ApiToken
  alias Operately.People.CliAuthSession
  alias Operately.Repo

  @deleted_account_name "Deleted Account"
  @deleted_person_name "Deleted User"
  @deleted_domain "operately.invalid"

  def run(%Account{} = account) do
    account = Repo.preload(account, :people)

    with :ok <- ensure_not_deleted(account),
         :ok <- ensure_not_last_site_admin(account),
         :ok <- ensure_not_last_owner(account) do
      Multi.new()
      |> anonymize_people(account.people)
      |> anonymize_account(account)
      |> Multi.delete_all(:account_tokens, AccountToken.account_and_contexts_query(account, :all))
      |> Multi.delete_all(:cli_auth_sessions, from(s in CliAuthSession, where: s.account_id == ^account.id))
      |> Multi.delete_all(:api_tokens, api_tokens_query(account.id))
      |> Repo.transaction()
      |> Repo.extract_result(:account)
    end
  end

  defp ensure_not_deleted(account) do
    if Account.deleted?(account), do: {:error, :not_found}, else: :ok
  end

  defp ensure_not_last_site_admin(%Account{site_admin: false}), do: :ok

  defp ensure_not_last_site_admin(%Account{} = account) do
    site_admin_count =
      Repo.aggregate(
        from(a in Account, where: a.site_admin == true and a.id != ^account.id),
        :count,
        :id
      )

    if site_admin_count == 0 do
      {:error, :last_site_admin}
    else
      :ok
    end
  end

  defp ensure_not_last_owner(%Account{} = account) do
    blocking_companies =
      account
      |> owned_company_ids()
      |> Enum.reduce([], fn company_id, acc ->
        company = Companies.get_company!(company_id)
        owners = Companies.list_owners(company)

        has_account_owner = Enum.any?(owners, &(&1.account_id == account.id))
        has_other_owner = Enum.any?(owners, &(&1.account_id != account.id))

        if has_account_owner and not has_other_owner do
          [company.name | acc]
        else
          acc
        end
      end)
      |> Enum.uniq()
      |> Enum.reverse()

    if blocking_companies == [] do
      :ok
    else
      {:error, {:last_owner, blocking_companies}}
    end
  end

  defp active_person?(person) do
    person.suspended != true and is_nil(person.suspended_at)
  end

  defp owned_company_ids(%Account{} = account) do
    account.people
    |> Enum.filter(&active_person?/1)
    |> Enum.map(& &1.company_id)
    |> Enum.reject(&is_nil/1)
    |> Enum.uniq()
  end

  defp anonymize_people(multi, people) do
    Enum.reduce(people, multi, fn person, multi ->
      Multi.update(multi, {:person, person.id}, person_changeset(person))
    end)
  end

  defp anonymize_account(multi, account) do
    Multi.update(multi, :account, account_changeset(account))
  end

  defp person_changeset(person) do
    Ecto.Changeset.change(person,
      full_name: @deleted_person_name,
      title: nil,
      avatar_url: nil,
      email: deleted_person_email(person.id),
      timezone: nil,
      description: nil,
      suspended: true,
      suspended_at: DateTime.utc_now() |> DateTime.truncate(:second),
      avatar_blob_id: nil
    )
  end

  defp account_changeset(account) do
    Ecto.Changeset.change(account,
      full_name: @deleted_account_name,
      email: deleted_account_email(account.id),
      hashed_password: nil,
      site_admin: false,
      deleted_at: DateTime.utc_now()
    )
  end

  defp api_tokens_query(account_id) do
    from(t in ApiToken,
      join: p in assoc(t, :person),
      where: p.account_id == ^account_id
    )
  end

  defp deleted_account_email(account_id) do
    "deleted+account-#{account_id}@#{@deleted_domain}"
  end

  defp deleted_person_email(person_id) do
    "deleted+person-#{person_id}@#{@deleted_domain}"
  end
end

defmodule Operately.CompanyTransfers.Import.ImporterOwnerFinalizer do
  @moduledoc """
  Ensures the account that started an import owns the imported company.

  This intentionally uses the low-level access APIs instead of the normal owner
  operation, because imports should not create owner-promotion activities.
  """

  alias Operately.Access
  alias Operately.Access.Binding
  alias Operately.Companies.Company
  alias Operately.People
  alias Operately.People.{Account, Person}
  alias Operately.Repo

  def finalize(company_id, account_id) when is_binary(company_id) and is_binary(account_id) do
    with {:ok, company} <- fetch_company(company_id),
         {:ok, account} <- fetch_account(account_id),
         {:ok, person} <- find_or_create_person(company, account),
         {:ok, _binding} <- ensure_person_owner_binding(company, person),
         {:ok, _membership} <- ensure_owner_group_membership(company, person) do
      {:ok, person}
    end
  end

  defp fetch_company(company_id) do
    case Repo.get(Company, company_id) do
      %Company{} = company -> {:ok, company}
      nil -> {:error, {:imported_company_not_found, company_id}}
    end
  end

  defp fetch_account(account_id) do
    case Repo.get(Account, account_id) do
      %Account{} = account -> {:ok, account}
      nil -> {:error, {:importer_account_not_found, account_id}}
    end
  end

  defp find_or_create_person(%Company{} = company, %Account{} = account) do
    case People.get_person(account, company) do
      %Person{} = person ->
        {:ok, person}

      nil ->
        People.create_person(%{
          company_id: company.id,
          account_id: account.id,
          full_name: account.full_name,
          email: account.email
        })
    end
  end

  defp ensure_person_owner_binding(%Company{} = company, %Person{} = person) do
    context = Access.get_context!(company_id: company.id)

    Access.bind(context, person_id: person.id, level: Binding.full_access())
  end

  defp ensure_owner_group_membership(%Company{} = company, %Person{} = person) do
    owner_group = Access.get_group!(company_id: company.id, tag: :full_access)

    Access.add_to_group(owner_group, person_id: person.id)
  end
end

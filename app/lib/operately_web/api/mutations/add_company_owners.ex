defmodule OperatelyWeb.Api.Mutations.AddCompanyOwners do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  alias Operately.Companies.Company
  alias Operately.Companies.Permissions
  alias Operately.Operations.CompanyOwnersAdding
  alias Operately.People

  inputs do
    field? :people_ids, list_of(:id), null: true
  end

  def call(conn, inputs) do
    people_ids = inputs[:people_ids] || []

    with(
      {:ok, me} <- find_me(conn),
      {:ok, company} <- get_company(conn),
      {:ok, :allowed} <- authorize(company, company_read_only(conn)),
      :ok <- People.validate_active_company_members(company.id, people_ids),
      {:ok, _} <- CompanyOwnersAdding.run(me, people_ids)
    ) do
      {:ok, %{}}
    else
      {:error, :invalid_company_member} -> {:error, :bad_request}
      {:error, :forbidden} -> {:error, :forbidden}
      {:error, :not_found} -> {:error, :not_found}
      {:error, _} -> {:error, :internal_server_error}
    end
  end

  defp get_company(conn) do
    Company.get(me(conn), id: me(conn).company_id)
  end

  defp authorize(company, company_read_only) do
    Permissions.check(company.request_info.access_level, :can_manage_owners, company_read_only: company_read_only)
  end

end

defmodule OperatelyWeb.Api.Mutations.RemoveCompanyOwner do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  alias Operately.Companies.Company
  alias Operately.Companies.Permissions
  alias Operately.Operations.CompanyOwnerRemoving

  inputs do
    field :person_id, :id
  end

  def call(conn, inputs) do
    with(
      {:ok, me} <- find_me(conn),
      {:ok, company} <- find_company(conn),
      {:ok, :allowed} <- authorize(company),
      {:ok, _} <- CompanyOwnerRemoving.run(me, inputs.person_id)
    ) do
      {:ok, %{}}
    else
      {:error, :forbidden} -> {:error, :forbidden}
      {:error, :not_found} -> {:error, :not_found}
      {:error, _} -> {:error, :internal_server_error}
    end
  end

  defp authorize(company) do
    Permissions.check(company.request_info.access_level, :can_manage_owners)
  end

  defp find_company(conn) do
    Company.get(me(conn), id: me(conn).company_id)
  end
end

defmodule OperatelyWeb.Api.Companies.DeleteOwner do
  @moduledoc """
  Removes an owner from a company.
  """

  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  alias Operately.Companies.Company
  alias Operately.Companies.Permissions
  alias Operately.Operations.CompanyOwnerRemoving
  alias Operately.People.Person

  inputs do
    field :person_id, :id, null: false
  end

  def call(conn, inputs) do
    with(
      {:ok, me} <- find_me(conn),
      {:ok, company} <- get_company(conn),
      {:ok, :allowed} <- authorize(company, company_read_only(conn)),
      {:ok, owner} <- find_owner(company, inputs.person_id),
      {:ok, _} <- CompanyOwnerRemoving.run(me, owner.id)
    ) do
      {:ok, %{}}
    else
      {:error, :forbidden} -> {:error, :forbidden}
      {:error, :not_found} -> {:error, :not_found}
      {:error, _} -> {:error, :internal_server_error}
    end
  end

  defp find_owner(company, person_id) do
    with %Person{} = person <- Repo.get_by(Person, id: person_id, company_id: company.id),
         true <- Company.is_owner?(company, person) do
      {:ok, person}
    else
      _ -> {:error, :not_found}
    end
  end

  defp authorize(company, company_read_only) do
    Permissions.check(company.request_info.access_level, :can_manage_owners, company_read_only: company_read_only)
  end

  defp get_company(conn) do
    Company.get(me(conn), id: me(conn).company_id)
  end
end

defmodule OperatelyWeb.Api.Mutations.RestoreCompanyMember do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  alias Operately.Operations.CompanyMemberRestoring
  alias Operately.Companies.Company
  alias Operately.Companies.Permissions
  alias Operately.People.Person

  inputs do
    field :person_id, :id
  end

  def call(conn, inputs) do
    with(
      {:ok, me} <- find_me(conn),
      {:ok, company} <- find_company(conn),
      {:ok, person} <- find_person(conn, inputs.person_id),
      {:ok, :allowed} <- authorize(company, person),
      {:ok, _} <- execute(me, person)
    ) do
      {:ok, %{}}
    else
      {:error, :forbidden} -> {:error, :forbidden}
      {:error, :not_found} -> {:error, :not_found}
      {:error, _} -> {:error, :internal_server_error}
    end
  end

  defp authorize(company, person) do
    if company.id == person.company_id do
      Permissions.check(company.request_info.access_level, :can_restore_members)
    else
      {:error, :forbidden}
    end
  end

  defp find_company(conn) do
    Company.get(me(conn), id: me(conn).company_id)
  end

  defp find_person(conn, person_id) do
    Person.get(me(conn), id: person_id)
  end

  defp execute(me, person) do
    CompanyMemberRestoring.run(me, person)
  end
end

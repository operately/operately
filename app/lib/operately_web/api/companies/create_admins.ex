defmodule OperatelyWeb.Api.Companies.CreateAdmins do
  @moduledoc """
  Creates admins for a company.
  """

  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  import Operately.Access.Filters, only: [filter_by_edit_access: 2]

  alias Operately.Companies.Company
  alias Operately.People

  inputs do
    field :people_ids, list_of(:id), null: false
  end

  def call(conn, inputs) do
    me = me(conn)
    company = company(conn)

    if has_permissions?(me, company) do
      with :ok <- People.validate_active_company_members(company.id, inputs.people_ids) do
        {:ok, _} = Operately.Operations.CompanyAdminAdding.run(me, inputs.people_ids)
        {:ok, %{}}
      else
        {:error, :invalid_company_member} -> {:error, :bad_request}
      end
    else
      {:error, :forbidden}
    end
  end

  defp has_permissions?(person, company) do
    dev_env?() || company_admin?(person, company)
  end

  defp dev_env?() do
    Application.get_env(:operately, :app_env) == :dev
  end

  defp company_admin?(person, company) do
    from(c in Company, where: c.id == ^company.id)
    |> filter_by_edit_access(person.id)
    |> Repo.exists?()
  end
end

defmodule OperatelyWeb.Api.Mutations.AddCompanyAdmins do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  import Operately.Access.Filters, only: [filter_by_full_access: 2]

  alias Operately.Companies.Company

  inputs do
    field :people_ids, list_of(:id)
  end

  def call(conn, inputs) do
    me = me(conn)
    company = company(conn)

    if has_permissions?(me, company) do
      {:ok, _} = Operately.Operations.CompanyAdminAdding.run(me, company, inputs.people_ids)
      {:ok, %{}}
    else
      {:error, :forbidden}
    end
  end

  defp has_permissions?(person, company) do
    dev_env?() || company_owner?(person, company)
  end

  defp dev_env?() do
    Application.get_env(:operately, :app_env) == :dev
  end

  defp company_owner?(person, company) do
    from(c in Company, where: c.id == ^company.id)
    |> filter_by_full_access(person.id)
    |> Repo.exists?()
  end
end

defmodule OperatelyWeb.Api.Mutations.EditCompanyMembersPermissions do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  import Operately.Access.Filters, only: [filter_by_full_access: 2]

  alias Operately.Companies.Company
  alias Operately.Operations.CompanyMembersPermissionsEditing

  inputs do
    field :members, list_of(:edit_member_permissions_input), null: false
  end

  outputs do
    field :success, :boolean, null: false
  end

  def call(conn, inputs) do
    me = me(conn)
    company = company(conn)

    if has_permissions?(me, company) do
      {:ok, _} = CompanyMembersPermissionsEditing.run(me, inputs.members)
      {:ok, %{success: true}}
    else
      {:error, :forbidden}
    end
  end

  defp has_permissions?(person, company) do
    dev_env?() || company_full_access?(person, company)
  end

  defp dev_env?() do
    Application.get_env(:operately, :app_env) == :dev
  end

  defp company_full_access?(person, company) do
    from(c in Company, where: c.id == ^company.id)
    |> filter_by_full_access(person.id)
    |> Repo.exists?()
  end
end

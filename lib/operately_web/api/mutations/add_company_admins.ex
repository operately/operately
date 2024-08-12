defmodule OperatelyWeb.Api.Mutations.AddCompanyAdmins do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  import Operately.Access.Filters, only: [filter_by_full_access: 2]

  alias Operately.Companies.Company

  inputs do
    field :people_ids, list_of(:string)
  end

  def call(conn, inputs) do
    {:ok, ids} = decode_id(inputs.people_ids)

    if has_permissions?(me(conn), company(conn)) do
      {:ok, _} = Operately.Operations.CompanyAdminAdding.run(me(conn), ids)
      {:ok, %{}}
    else
      {:error, :forbidden}
    end
  end

  defp has_permissions?(person, company) do
    from(c in Company, where: c.id == ^company.id)
    |> filter_by_full_access(person.id)
    |> Repo.exists?()
  end
end

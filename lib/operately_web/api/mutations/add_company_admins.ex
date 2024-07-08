defmodule OperatelyWeb.Api.Mutations.AddCompanyAdmins do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  inputs do
    field :people_ids, list_of(:string)
  end

  def call(conn, inputs) do
    {:ok, ids} = decode_id(inputs.people_ids)
    Operately.Companies.add_admins(me(conn), ids)

    {:ok, %{}}
  end
end

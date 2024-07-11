defmodule OperatelyWeb.Api.Mutations.EditSpacePermissions do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  inputs do
    field :space_id, :string
    field :access_levels, :access_levels
  end

  outputs do
    field :success, :boolean
  end

  def call(conn, inputs) do
    {:ok, id} = decode_id(inputs.space_id)

    space = Operately.Groups.get_group!(id)

    {:ok, _} = Operately.Operations.GroupPermissionsEditing.run(me(conn), space, inputs.access_levels)

    {:ok, true}
  end
end

defmodule OperatelyWeb.Api.Mutations.EditSpacePermissions do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  alias Operately.Groups
  alias Operately.Groups.Permissions

  inputs do
    field :space_id, :string
    field :access_levels, :access_levels
  end

  outputs do
    field :success, :boolean
  end

  def call(conn, inputs) do
    person = me(conn)
    {:ok, space_id} = decode_id(inputs.space_id)

    case Groups.get_group_and_access_level(space_id, person.id) do
      {:ok, space, access_level} ->
        if Permissions.can_edit_permissions(access_level) do
          execute(person, space, inputs)
        else
          {:error, :forbidden}
        end
      {:error, reason} -> {:error, reason}
    end
  end

  defp execute(person, space, inputs) do
    {:ok, _} = Operately.Operations.GroupPermissionsEditing.run(person, space, inputs.access_levels)
    {:ok, %{success: true}}
  end
end

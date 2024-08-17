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

    with {:ok, space_id} <- decode_id(inputs.space_id),
        {:ok, space, access_level} <- Groups.get_group_and_access_level(space_id, person.id),
        {:ok, :allowed} <- Permissions.can_edit_permissions(access_level)
    do
      execute(person, space, inputs)
    else
      {:error, reason} -> {:error, reason}
      _ -> {:error, :bad_request}
    end
  end

  defp execute(person, space, inputs) do
    {:ok, _} = Operately.Operations.GroupPermissionsEditing.run(person, space, inputs.access_levels)
    {:ok, %{success: true}}
  end
end

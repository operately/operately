defmodule OperatelyWeb.Api.Mutations.EditSpaceMembersPermissions do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  alias Operately.Groups
  alias Operately.Groups.Permissions

  inputs do
    field :group_id, :string
    field :members, list_of(:edit_member_permissions_input)
  end

  outputs do
    field :success, :boolean
  end

  def call(conn, inputs) do
    person = me(conn)
    {:ok, space_id} = decode_id(inputs.group_id)

    case Groups.get_group_and_access_level(space_id, person.id) do
      {:ok, space, access_level} ->
        if Permissions.can_edit_members_permissions(access_level) do
          execute(person, space, inputs)
        else
          {:error, :forbidden}
        end
      {:error, reason} -> {:error, reason}
    end
  end

  defp execute(person, space, inputs) do
    members = decode_ids(inputs.members)

    {:ok, _} = Operately.Operations.GroupMembersPermissionsEditing.run(person, space, members)
    {:ok, %{success: true}}
  end

  defp decode_ids(members) do
    Enum.map(members, fn member ->
      {:ok, id} = decode_id(member.id)
      %{id: id, access_level: member.access_level}
    end)
  end
end

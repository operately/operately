defmodule OperatelyWeb.Api.Mutations.EditSpaceMembersPermissions do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  inputs do
    field :group_id, :string
    field :members, list_of(:edit_member_permissions_input)
  end

  outputs do
    field :success, :boolean
  end

  def call(conn, inputs) do
    {:ok, group_id} = decode_id(inputs.group_id)

    group = Operately.Groups.get_group!(group_id)
    author = me(conn)
    members = decode_ids(inputs.members)

    {:ok, _} = Operately.Operations.GroupMembersPermissionsEditing.run(author, group, members)

    {:ok, true}
  end

  defp decode_ids(members) do
    Enum.map(members, fn member ->
      {:ok, id} = decode_id(member.id)
      %{id: id, access_level: member.access_level}
    end)
  end
end

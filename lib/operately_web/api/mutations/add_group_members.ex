defmodule OperatelyWeb.Api.Mutations.AddGroupMembers do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  inputs do
    field :group_id, :string
    field :members, list_of(:add_member_input)
  end

  def call(_conn, inputs) do
    {:ok, id} = decode_id(inputs.group_id)
    inputs = decode_member_ids(inputs)

    Operately.Operations.GroupMembersAdding.run(id, inputs.members)

    {:ok, %{}}
  end

  defp decode_member_ids(inputs) do
    members = Enum.map(inputs.members, fn member ->
      {:ok, id} = decode_id(member.id)

      %{id: id, permissions: member.permissions}
    end)

    %{inputs | members: members}
  end
end

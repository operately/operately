defmodule OperatelyWeb.Api.Mutations.AddGroupMembers do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  inputs do
    field :group_id, :string
    field :members, list_of(:add_member_input)
  end

  def call(_conn, inputs) do
    {:ok, id} = decode_id(inputs.group_id)
    Operately.Operations.GroupMembersAdding.run(id, inputs.members)

    {:ok, %{}}
  end
end

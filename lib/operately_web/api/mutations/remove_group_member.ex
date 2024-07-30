defmodule OperatelyWeb.Api.Mutations.RemoveGroupMember do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  inputs do
    field :group_id, :string
    field :member_id, :string
  end

  def call(conn, inputs) do
    {:ok, group_id} = decode_id(inputs.group_id)
    {:ok, member_id} = decode_id(inputs.member_id)

    {:ok, _} = Operately.Operations.GroupMemberRemoving.run(me(conn), group_id, member_id)


    {:ok, %{}}
  end
end

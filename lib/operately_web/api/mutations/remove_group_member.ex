defmodule OperatelyWeb.Api.Mutations.RemoveGroupMember do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  inputs do
    field :group_id, :string
    field :member_id, :string
  end

  def call(_, inputs) do
    {:ok, id} = decode_id(inputs.group_id)
    {:ok, _} = Operately.Operations.GroupMemberRemoving.run(id, inputs.member_id)


    {:ok, %{}}
  end
end

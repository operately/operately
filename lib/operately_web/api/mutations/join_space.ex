defmodule OperatelyWeb.Api.Mutations.JoinSpace do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  inputs do
    field :space_id, :string
  end

  def call(conn, inputs) do
    {:ok, space_id} = decode_id(inputs.space_id)
    {:ok, _} = Operately.Operations.SpaceJoining.run(me(conn), space_id)

    {:ok, %{}}
  end
end

defmodule OperatelyWeb.Api.Mutations.AcknowledgeProjectCheckIn do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  inputs do
    field :id, :string
  end

  outputs do
    field :check_in, :project_check_in
  end

  def call(conn, inputs) do
    {:ok, id} = decode_id(inputs.id)
    {:ok, check_in} = Operately.Operations.ProjectCheckInAcknowledgement.run(me(conn), id)

    {:ok, %{check_in: Serializer.serialize(check_in, level: :essential)}}
  end
end

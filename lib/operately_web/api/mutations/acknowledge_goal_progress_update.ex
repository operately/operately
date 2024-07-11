defmodule OperatelyWeb.Api.Mutations.AcknowledgeGoalProgressUpdate do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  inputs do
    field :id, :string
  end

  outputs do
    field :update, :goal_progress_update
  end

  def call(conn, inputs) do
    {:ok, id} = decode_id(inputs.id)
    person = me(conn)
    update = Operately.Updates.get_update!(id)

    {:ok, update} = Operately.Updates.acknowledge_update(person, update)
    {:ok, %{update: OperatelyWeb.Api.Serializer.serialize(update)}}
  end
end

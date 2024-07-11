defmodule OperatelyWeb.Api.Mutations.ReopenGoal do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  inputs do
    field :id, :string
    field :message, :string
  end

  outputs do
    field :goal, :goal
  end

  def call(conn, inputs) do
    author = me(conn)
    {:ok, goal_id} = decode_id(inputs.id)
    message = inputs.message

    {:ok, goal} = Operately.Operations.GoalReopening.run(author, goal_id, message)
    {:ok, %{goal: OperatelyWeb.Api.Serializer.serialize(goal)}}
  end
end

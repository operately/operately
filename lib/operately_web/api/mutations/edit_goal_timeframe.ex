defmodule OperatelyWeb.Api.Mutations.EditGoalTimeframe do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  inputs do
    field :id, :string
    field :timeframe, :timeframe
    field :comment, :string
  end

  outputs do
    field :goal, :goal
  end

  def call(conn, inputs) do
    author = me(conn)
    {:ok, goal_id} = decode_id(inputs.id)

    inputs = Map.put(inputs, :id, goal_id)

    {:ok, goal} = Operately.Operations.GoalTimeframeEditing.run(author, inputs)
    {:ok, %{goal: OperatelyWeb.Api.Serializer.serialize(goal)}}
  end
end

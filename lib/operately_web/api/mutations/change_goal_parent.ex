defmodule OperatelyWeb.Api.Mutations.ChangeGoalParent do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  inputs do
    field :goal_id, :string
    field :parent_goal_id, :string
  end

  outputs do
    field :goal, :goal
  end

  def call(conn, inputs) do
    author = me(conn)
    {:ok, goal_id} = decode_id(inputs.goal_id)
    {:ok, parent_goal_id} = decode_id(inputs.parent_goal_id)

    {:ok, goal} = Operately.Operations.GoalReparent.run(author, goal_id, parent_goal_id)
    {:ok, %{goal: OperatelyWeb.Api.Serializer.serialize(goal)}}
  end
end

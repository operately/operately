defmodule OperatelyWeb.Api.Mutations.CloseGoal do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  inputs do
    field :goal_id, :string
    field :success, :string
    field :retrospective, :string
  end

  outputs do
    field :goal, :goal
  end

  def call(conn, inputs) do
    author = me(conn)
    {:ok, goal_id} = decode_id(inputs.goal_id)
    {:ok, goal} = Operately.Operations.GoalClosing.run(author, goal_id, inputs.success, inputs.retrospective)

    {:ok, %{goal: OperatelyWeb.Api.Serializer.serialize(goal)}}
  end
end

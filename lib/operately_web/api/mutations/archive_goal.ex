defmodule OperatelyWeb.Api.Mutations.ArchiveGoal do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  inputs do
    field :goal_id, :string
  end

  outputs do
    field :goal, :goal
  end

  def call(conn, inputs) do
    author = me(conn)
    {:ok, goal_id} = decode_id(inputs.goal_id)
    goal = Operately.Goals.get_goal!(goal_id)

    {:ok, goal} = Operately.Operations.GoalArchived.run(author, goal)
    {:ok, %{goal: OperatelyWeb.Api.Serializer.serialize(goal)}}
  end
end

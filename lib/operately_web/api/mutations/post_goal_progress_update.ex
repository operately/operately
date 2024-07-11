defmodule OperatelyWeb.Api.Mutations.PostGoalProgressUpdate do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  inputs do
    field :content, :string
    field :goal_id, :string
    field :new_target_values, :string
  end

  outputs do
    field :update, :goal_progress_update
  end

  def call(conn, inputs) do
    author = me(conn)
    content = Jason.decode!(inputs.content)
    {:ok, goal_id} = decode_id(inputs.goal_id)

    target_values = Jason.decode!(inputs.new_target_values)
    goal = Operately.Goals.get_goal!(goal_id)
    {:ok, update} = Operately.Operations.GoalCheckIn.run(author, goal, content, target_values)

    {:ok, %{update: OperatelyWeb.Api.Serializer.serialize(update)}}
  end
end

defmodule OperatelyWeb.Api.Mutations.EditGoalProgressUpdate do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  inputs do
    field :id, :string
    field :content, :string
    field :new_target_values, :string
  end

  outputs do
    field :update, :goal_progress_update
  end

  def call(conn, inputs) do
    {:ok, id} = decode_id(inputs.id)
    author = me(conn)
    content = Jason.decode!(inputs.content)
    update = Operately.Updates.get_update!(id)

    target_values = Jason.decode!(inputs.new_target_values)
    goal = Operately.Goals.get_goal!(update.updatable_id)
    {:ok, update} = Operately.Operations.GoalCheckInEdit.run(author, goal, update, content, target_values)

    {:ok, %{update: OperatelyWeb.Api.Serializer.serialize(update, level: :full)}}  
  end
end

defmodule OperatelyWeb.Api.Mutations.CreateGoalDiscussion do
  use TurboConnect.Mutation

  inputs do
    field :goal_id, :string
    field :title, :string
    field :message, :string
  end

  outputs do
    field :id, :string
  end

  def call(conn, inputs) do
    author = conn.assigns.current_account.person
    title = inputs.title
    message = inputs.message

    goal = Operately.Goals.get_goal!(inputs.goal_id)

    if goal do
      {:ok, activity} = Operately.Operations.GoalDiscussionCreation.run(author, goal, title, message)
      {:ok, %{id: activity.id}}
    else
      {:error, :not_found}
    end
  end

end

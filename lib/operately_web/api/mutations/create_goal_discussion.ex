defmodule OperatelyWeb.Api.Mutations.CreateGoalDiscussion do
  use TurboConnect.Mutation

  alias OperatelyWeb.Api.Validations.UUID

  inputs do
    field :goal_id, :string
    field :title, :string
    field :message, :string
  end

  outputs do
    field :id, :string
  end

  def call(conn, inputs) do
    UUID.validate_format!(inputs.goal_id)

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
  rescue
    UUID.InvalidUUID -> {:error, :bad_request}
  end

end

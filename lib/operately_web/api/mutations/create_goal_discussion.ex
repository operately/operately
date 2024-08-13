defmodule OperatelyWeb.Api.Mutations.CreateGoalDiscussion do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  import Operately.Access.Filters, only: [filter_by_edit_access: 2, forbidden_or_not_found: 2]

  alias Operately.Repo

  inputs do
    field :goal_id, :string
    field :title, :string
    field :message, :string
  end

  outputs do
    field :id, :string
  end

  def call(conn, inputs) do
    author = me(conn)
    {:ok, goal_id} = decode_id(inputs.goal_id)

    case load_goal(author, goal_id) do
      nil ->
        query(goal_id)
        |> forbidden_or_not_found(author.id)

      goal ->
        {:ok, activity} = Operately.Operations.GoalDiscussionCreation.run(author, goal, inputs.title, inputs.message)
        activity = Operately.Repo.preload(activity, :comment_thread)
        {:ok, %{id: OperatelyWeb.Paths.activity_id(activity)}}
    end
  end

  defp load_goal(author, goal_id) do
    query(goal_id)
    |> filter_by_edit_access(author.id)
    |> Repo.one()
  end

  defp query(goal_id) do
    from(g in Operately.Goals.Goal, where: g.id == ^goal_id)
  end
end

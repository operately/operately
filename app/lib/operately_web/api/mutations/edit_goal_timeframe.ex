defmodule OperatelyWeb.Api.Mutations.EditGoalTimeframe do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  import Operately.Access.Filters, only: [filter_by_edit_access: 2, forbidden_or_not_found: 2]

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

    case load_goal(author, goal_id) do
      nil ->
        query(goal_id)
        |> forbidden_or_not_found(author.id)

      goal ->
        {:ok, goal} = Operately.Operations.GoalTimeframeEditing.run(author, goal, inputs)
        {:ok, %{goal: OperatelyWeb.Api.Serializer.serialize(goal)}}
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

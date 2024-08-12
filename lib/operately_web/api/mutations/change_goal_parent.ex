defmodule OperatelyWeb.Api.Mutations.ChangeGoalParent do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  import Operately.Access.Filters, only: [filter_by_edit_access: 2, forbidden_or_not_found: 2]

  alias Operately.Repo

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

    case load_goal(author, goal_id) do
      nil ->
        query(goal_id)
        |> forbidden_or_not_found(author.id)

      goal ->
        {:ok, goal} = Operately.Operations.GoalReparent.run(author, goal, parent_goal_id)
        {:ok, %{goal: OperatelyWeb.Api.Serializer.serialize(goal)}}
    end
  end

  defp load_goal(person, goal_id) do
    query(goal_id)
    |> filter_by_edit_access(person.id)
    |> Repo.one()
  end

  defp query(goal_id) do
    from(g in Operately.Goals.Goal, where: g.id == ^goal_id)
  end
end

defmodule OperatelyWeb.Api.Goals.ChangeParent do
  @moduledoc """
  Changes the parent goal of a goal.
  """

  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  import Operately.Access.Filters, only: [filter_by_full_access: 2, forbidden_or_not_found: 2]

  alias Operately.Repo

  inputs do
    field :goal_id, :id, null: false
    field :parent_goal_id, :id, null: true
  end

  outputs do
    field? :goal, :goal, null: true
  end

  def call(conn, inputs) do
    author = me(conn)

    case load_goal(author, inputs.goal_id) do
      nil ->
        query(inputs.goal_id)
        |> forbidden_or_not_found(author.id)

      goal ->
        {:ok, goal} = Operately.Operations.GoalReparent.run(author, goal, inputs.parent_goal_id)
        {:ok, %{goal: OperatelyWeb.Api.Serializer.serialize(goal)}}
    end
  end

  defp load_goal(person, goal_id) do
    query(goal_id)
    |> filter_by_full_access(person.id)
    |> Repo.one()
  end

  defp query(goal_id) do
    from(g in Operately.Goals.Goal, where: g.id == ^goal_id)
  end
end

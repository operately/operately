defmodule OperatelyWeb.Api.Mutations.ArchiveGoal do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  import Operately.Access.Filters, only: [filter_by_full_access: 2, forbidden_or_not_found: 2]

  alias Operately.Repo

  inputs do
    field :goal_id, :string
  end

  outputs do
    field :goal, :goal
  end

  def call(conn, inputs) do
    {:ok, goal_id} = decode_id(inputs.goal_id)

    case load_goal(me(conn), goal_id) do
      {:error, reason} ->
        {:error, reason}

      goal ->
        {:ok, goal} = Operately.Operations.GoalArchived.run(me(conn), goal)
        {:ok, %{goal: OperatelyWeb.Api.Serializer.serialize(goal)}}
    end
  end

  defp load_goal(person, goal_id) do
    query = from(g in Operately.Goals.Goal, where: g.id == ^goal_id)

    filter_by_full_access(query, person.id)
    |> Repo.one()
    |> case do
      nil -> forbidden_or_not_found(query, person.id)
      goal -> goal
    end
  end
end

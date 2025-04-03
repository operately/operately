defmodule Operately.Data.Change012CreateGoalsAccessContext do
  import Ecto.Query, only: [from: 2]

  alias Operately.Repo
  alias Operately.Access
  alias Operately.Goals.Goal
  alias Operately.Access.Context

  def run do
    Repo.transaction(fn ->
      goals = from(g in Goal, select: g.id) |> Repo.all(with_deleted: true)

      Enum.each(goals, fn goal_id ->
        case create_goal_access_contexts(goal_id) do
          {:error, _} -> raise "Failed to create access context"
          _ -> :ok
        end
      end)
    end)
  end

  defp create_goal_access_contexts(goal_id) do
    existing_context = Repo.one(from c in Context, where: c.goal_id == ^goal_id, select: c.id)

    if existing_context do
      :ok
    else
      Access.create_context(%{goal_id: goal_id})
    end
  end
end

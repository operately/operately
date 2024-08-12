defmodule Operately.Operations.GoalReparent do
  alias Ecto.Multi
  alias Operately.Repo
  alias Operately.Activities

  def run(author, goal, parent_goal_id) do
    Multi.new()
    |> Multi.update(:goal, Operately.Goals.Goal.changeset(goal, %{parent_goal_id: parent_goal_id}))
    |> Activities.insert_sync(author.id, :goal_reparent, fn changes ->
      %{
        company_id: goal.company_id,
        old_parent_goal_id: goal.parent_goal_id,
        new_parent_goal_id: changes.goal.parent_goal_id,
      }
    end)
    |> Repo.transaction()
    |> Repo.extract_result(:goal)
  end
end

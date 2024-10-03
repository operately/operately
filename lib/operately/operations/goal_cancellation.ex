defmodule Operately.Operations.GoalCancellation do
  alias Ecto.Multi
  alias Operately.Repo
  alias Operately.Goals.Goal
  alias Operately.Activities
  alias Operately.Access

  def run(canceller, goal_id, reason) do
    goal = Repo.get!(Goal, goal_id)

    Multi.new()
    |> update_goal(goal, reason)
    |> remove_bindings(goal)
    |> insert_activity(canceller, goal, reason)
    |> Repo.transaction()
    |> Repo.extract_result(:goal)
  end

  defp update_goal(multi, goal, reason) do
    Multi.update(multi, :goal, Goal.cancellation_changeset(goal, %{
      cancelled_at: DateTime.utc_now(),
      cancellation_reason: reason
    }))
  end

  defp remove_bindings(multi, goal) do
    Multi.run(multi, :remove_bindings, fn _repo, _changes ->
      {count, nil} = Access.delete_all_bindings(goal)
      {:ok, count}
    end)
  end


  defp insert_activity(multi, canceller, goal, reason) do
    Activities.insert_sync(multi, canceller.id, :goal_cancelled, fn changes ->
      %{
        company_id: goal.company_id,
        space_id: goal.group_id,
        goal_id: goal.id,
        goal_name: goal.name,
        champion_id: goal.champion_id,
        reviewer_id: goal.reviewer_id,
        canceller_id: canceller.id,
        cancellation_reason: reason
      }
    end)
  end
end

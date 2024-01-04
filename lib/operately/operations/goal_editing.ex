defmodule Operately.Operations.GoalEditing do
  alias Ecto.Multi
  alias Operately.Repo
  alias Operately.Activities
  alias Operately.Goals.Goal

  def run(author, goal, attrs) do
    changeset = Goal.changeset(goal, %{
      name: attrs.name,
      champion_id: attrs.champion_id,
      reviewer_id: attrs.reviewer_id,
      timeframe: attrs.timeframe,
    })

    Multi.new()
    |> Multi.update(:goal, changeset)
    |> Activities.insert(author.id, :goal_editing, fn changes ->
      %{
        company_id: goal.company_id,
        goal_id: changes.goal.id,
        old_name: goal.name,
        new_name: changes.goal.name,
        old_champion_id: goal.champion_id,
        new_champion_id: changes.goal.champion_id,
        old_reviewer_id: goal.reviewer_id,
        new_reviewer_id: changes.goal.reviewer_id,
        old_timeframe: goal.timeframe,
        new_timeframe: changes.goal.timeframe,
      }
    end)
    |> Repo.transaction()
    |> Repo.extract_result(:goal)
  end
end

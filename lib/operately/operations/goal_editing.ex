defmodule Operately.Operations.GoalEditing do
  alias Ecto.Multi
  alias Operately.Repo
  alias Operately.Activities
  alias Operately.Goals.{Goal, Target}

  def run(author, goal, attrs) do
    Multi.new()
    |> update_goal(goal, attrs)
    |> update_targets(goal, attrs)
    |> insert_activity(author, goal)
    |> Repo.transaction()
    |> Repo.extract_result(:goal)
  end

  defp update_goal(multi, goal, attrs) do
    changeset = Goal.changeset(goal, %{
      name: attrs.name,
      champion_id: attrs.champion_id,
      reviewer_id: attrs.reviewer_id,
      timeframe: attrs.timeframe,
    })

    Multi.update(multi, :goal, changeset)
  end

  defp update_targets(multi, goal, attrs) do
    targets = Repo.preload(goal, :targets).targets

    multi = Enum.reduce(attrs.updated_targets, multi, fn target_attrs, multi ->
      target = Enum.find(targets, fn target -> target.id == target_attrs.id end)
      changeset = Target.changeset(target, target_attrs)

      Multi.update(multi, "updated_target_#{target.id}", changeset)
    end)

    multi = Enum.reduce(attrs.added_targets, multi, fn target_attrs, multi ->
      attrs = Map.merge(target_attrs, %{goal_id: goal.id, value: target_attrs.from})
      changeset = Target.changeset(%Target{}, attrs)

      Multi.insert(multi, "added_target_#{target_attrs.index}", changeset)
    end)

    multi = Enum.reduce(targets, multi, fn target, multi ->
      if Enum.find(attrs.updated_targets, fn t -> target.id == t.id end) do
        multi
      else
        Multi.delete(multi, "deleted_target_#{target.id}", target)
      end
    end)

    multi
  end

  defp insert_activity(multi, author, goal) do
    Activities.insert(multi, author.id, :goal_editing, fn changes ->
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
  end
end

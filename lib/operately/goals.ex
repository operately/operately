defmodule Operately.Goals do
  import Ecto.Query, warn: false

  alias Operately.Repo
  alias Operately.Goals.Goal
  alias Operately.Goals.Target

  def list_goals do
    Repo.all(Goal)
  end

  def list_goals(filter) do
    from(goal in Goal)
    |> apply_if(filter.space_id, fn query -> 
      from(goal in query, where: goal.group_id == ^filter.space_id) 
    end)
    |> apply_if(filter.company_id, fn query -> 
      from(goal in query, where: goal.company_id == ^filter.company_id) 
    end)
    |> apply_if(filter.timeframe, fn query ->
      timeframes = 
        if filter.include_longer_timeframes do
          [filter.timeframe, String.split(filter.timeframe, " ") |> List.last()]
        else
          [filter.timeframe]
        end

      from(goal in query, where: goal.timeframe in ^timeframes)
    end)
    |> Repo.all()
  end

  defp apply_if(query, condition, fun) do
    if condition, do: fun.(query), else: query
  end

  def get_goal!(id), do: Repo.get_by_id(Goal, id, :with_deleted)

  defdelegate create_goal(creator, attrs), to: Operately.Operations.GoalCreation, as: :run
  defdelegate archive_goal(author, goal), to: Operately.Operations.GoalArchived, as: :run
  defdelegate get_permissions(goal, person), to: Operately.Goals.Permissions, as: :calculate

  def update_goal(%Goal{} = goal, attrs) do
    goal
    |> Goal.changeset(attrs)
    |> Repo.update()
  end

  def delete_goal(%Goal{} = goal) do
    Repo.delete(goal)
  end

  def change_goal(%Goal{} = goal, attrs \\ %{}) do
    Goal.changeset(goal, attrs)
  end

  def get_role(%Goal{} = goal, person) do
    cond do
      goal.champion_id == person.id -> :champion
      goal.reviewer_id == person.id -> :reviewer
      true -> nil
    end
  end

  def list_targets(goal_id) do
    from(target in Target, where: target.goal_id == ^goal_id, order_by: target.index)
    |> Repo.all()
  end

  def progress_percentage(goal) do
    targets = Repo.preload(goal, :targets).targets
    target_progresses = Enum.map(targets, &target_progress_percentage/1)

    Enum.sum(target_progresses) / length(target_progresses)
  end

  def target_progress_percentage(target) do
    from = target.from
    to = target.to
    current = target.value

    if from < to do
      cond do
        current > to -> 100
        current < from -> 0
        true -> (from - current) / (from - to) * 100
      end
    else
      cond do
        current < to -> 100
        current > from -> 0
        true -> (to - current) / (to - from) * 100
      end
    end
  end
end

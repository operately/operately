defmodule Operately.Goals do
  import Ecto.Query, warn: false

  alias Operately.Repo
  alias Operately.Goals.Goal
  alias Operately.Goals.Target
  alias Operately.Access.Fetch

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
    |> Repo.all()
  end

  defp apply_if(query, condition, fun) do
    if condition, do: fun.(query), else: query
  end

  def get_goal!(id), do: Repo.get_by_id(Goal, id, :with_deleted)

  def get_goal_with_access_level(goal_id, person_id) do
    from(g in Goal, as: :resource, where: g.id == ^goal_id)
    |> Fetch.get_resource_with_access_level(person_id)
  end

  defdelegate create_goal(creator, attrs), to: Operately.Operations.GoalCreation, as: :run
  defdelegate archive_goal(author, goal), to: Operately.Operations.GoalArchived, as: :run

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

    if Enum.empty?(target_progresses) do
      0
    else
      Enum.sum(target_progresses) / length(target_progresses)
    end
  end

  def target_progress_percentage(target) do
    from = target.from
    to = target.to
    current = target.value

    cond do
      from == to -> 100

      from < to ->
        cond do
          current > to -> 100
          current < from -> 0
          true -> (from - current) / (from - to) * 100
        end

      from > to ->
        cond do
          current < to -> 100
          current > from -> 0
          true -> (to - current) / (to - from) * 100
        end
    end
  end


  alias Operately.Goals.Update

  def list_updates(goal) do
    from(u in Update,
      where: u.goal_id == ^goal.id
    )
    |> Repo.all()
  end

  def create_update(attrs \\ %{}) do
    %Update{}
    |> Update.changeset(attrs)
    |> Repo.insert()
  end

  def update_update(%Update{} = update, attrs) do
    update
    |> Update.changeset(attrs)
    |> Repo.update()
  end

  

  def round_up(value, decimal_places \\ 2) do
    multiplier = :math.pow(10, decimal_places)
    value
    |> Float.ceil()
    |> Kernel.*(multiplier)
    |> Float.ceil()
    |> Kernel./(multiplier)
  end
end

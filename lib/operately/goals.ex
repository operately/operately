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
  alias Operately.Access.Binding

  def get_check_in(:system, id) do
    from(u in Update, where: u.id == ^id)
    |> Repo.one()
    |> case do
      nil -> {:error, :not_found}
      r -> {:ok, apply(r.__struct__, :set_requester_access_level, [r, Binding.full_access()])}
    end
  end

  def get_check_in(person, id) do
    from(u in Update,
      join: ac in assoc(u, :access_context),
      join: b in assoc(ac, :bindings),
      join: g in assoc(b, :group),
      join: m in assoc(g, :memberships),
      join: p in assoc(m, :person),
      where: m.person_id == ^person.id and is_nil(p.suspended_at),
      where: b.access_level >= ^Binding.view_access(),
      where: u.id == ^id,
      preload: [:goal, :author, :acknowledged_by, reactions: [:person]],
      group_by: [u.id, u.goal_id, u.author_id, u.message, u.acknowledged_at, u.acknowledged_by_id, u.targets, u.inserted_at, u.updated_at],
      select: {u, max(b.access_level)}
    )
    |> Repo.one()
    |> case do
      nil -> {:error, :not_found}
      {r, level} -> {:ok, apply(r.__struct__, :set_requester_access_level, [r, level])}
    end
  end
end

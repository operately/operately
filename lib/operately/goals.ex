defmodule Operately.Goals do
  import Ecto.Query, warn: false

  alias Operately.Repo
  alias Operately.Goals.Goal
  alias Operately.Goals.Target

  def list_goals do
    Repo.all(Goal)
  end

  def list_goals_for_space(_person, space_id) do
    query = from(goal in Goal, where: goal.group_id == ^space_id)

    Repo.all(query)
  end

  def list_goals_for_company(_person, company_id) do
    query = from(goal in Goal, where: goal.company_id == ^company_id)

    Repo.all(query)
  end

  def get_goal!(id), do: Repo.get_by_id(Goal, id, :with_deleted)

  defdelegate create_goal(creator, attrs), to: Operately.Goals.CreateOperation, as: :run
  defdelegate archive_goal(author, goal), to: Operately.Goals.ArchiveOperation, as: :run
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
end

defmodule Operately.Goals do
  import Ecto.Query, warn: false

  alias Operately.Repo
  alias Operately.Goals.Goal


  def list_goals do
    Repo.all(Goal)
  end

  def list_goals_for_space(_person, space_id) do
    query = from(goal in Goal, where: goal.group_id == ^space_id)

    Repo.all(query)
  end

  def get_goal!(id) do
    Repo.get!(Goal, id)
  end

  defdelegate create_goal(creator, attrs), to: Operately.Goals.CreateOperation, as: :run

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
end

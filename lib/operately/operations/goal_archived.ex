defmodule Operately.Operations.GoalArchived do
  alias Ecto.Multi
  alias Operately.Repo
  alias Operately.Activities

  def run(creator, goal) do
    Multi.new()
    |> Multi.run(:goal, fn repo, _ -> repo.soft_delete(goal) end)
    |> Activities.insert_sync(creator.id, :goal_archived, fn _changes -> %{
      company_id: goal.company_id,
      space_id: goal.group_id,
      goal_id: goal.id,
    } end)
    |> Repo.transaction()
    |> Repo.extract_result(:goal)
  end
end

defmodule Operately.Operations.GoalClosing do
  alias Ecto.Multi
  alias Operately.Repo
  alias Operately.Goals
  alias Operately.Activities

  def run(creator, goal_id, success) do
    goal = Goals.get_goal!(goal_id)

    changeset = Goals.Goal.changeset(goal, %{
      closed_at: DateTime.utc_now(), 
      closed_by_id: creator.id,
      success: success
    })

    Multi.new()
    |> Multi.update(:goal, changeset)
    |> Activities.insert_sync(creator.id, :goal_closing, fn _changes ->
      %{
        company_id: creator.company_id,
        space_id: goal.group_id,
        goal_id: goal_id,
        success: success
      }
    end)
    |> Repo.transaction()
    |> Repo.extract_result(:goal)
  end
end

defmodule Operately.Operations.GoalTimeframeEditing do
  alias Ecto.Multi
  alias Operately.Repo
  alias Operately.Activities

  def run(author, attrs) do
    goal = Operately.Goals.get_goal!(attrs.id)

    Multi.new()
    |> Multi.update(:goal, Operately.Goals.Goal.changeset(goal, %{timeframe: attrs.timeframe}))
    |> Activities.insert_sync(author.id, :goal_timeframe_editing, fn changes ->
      %{
        company_id: goal.company_id,
        space_id: goal.group_id,
        goal_id: goal.id,
        old_timeframe: Map.from_struct(goal.timeframe),
        new_timeframe: Map.from_struct(changes.goal.timeframe)
      }
    end)
    |> Repo.transaction()
    |> Repo.extract_result(:goal)
  end
end

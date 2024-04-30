defmodule Operately.Operations.GoalTimeframeEditing do
  alias Ecto.Multi
  alias Operately.Repo
  alias Operately.Activities

  def run(author, attrs) do
    goal = Operately.Goals.get_goal!(attrs.id)

    Multi.new()
    |> Multi.update(:goal, Operately.Goals.Goal.changeset(%{timeframe: attrs.timeframe}))
    |> Activities.insert_sync(author.id, :goal_timeframe_editing, fn changes ->
      %{
        old_timeframe: Map.from_struct(goal.timeframe),
        new_timeframe: Map.from_struct(changes.changes.goal.changeset.changes.timeframe)
      }
    end)
    |> Repo.transaction()
    |> Repo.extract_result(:goal)
  end
end

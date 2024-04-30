defmodule Operately.Operations.GoalTimeframeEditing do
  alias Ecto.Multi
  alias Operately.Repo
  alias Operately.Activities

  def run(creator, attrs) do
    raise "Operation for GoalTimeframeEditing not implemented"

    # Multi.new()
    # |> Multi.insert(:something, ...)
    # |> Activities.insert(creator.id, :goal_timeframe_editing, fn changes ->
    #   %{
    #   old_timeframe: "TODO"    #   new_timeframe: "TODO"
    #   }
    # end)
    # |> Repo.transaction()
    # |> Repo.extract_result(:something)
  end
end

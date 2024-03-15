defmodule Operately.Operations.GoalReparent do
  alias Ecto.Multi
  alias Operately.Repo
  alias Operately.Activities

  def run(creator, attrs) do
    raise "Operation for GoalReparent not implemented"

    # Multi.new()
    # |> Multi.insert(:something, ...)
    # |> Activities.insert(creator.id, :goal_reparent, fn changes ->
    #   %{
    #   company_id: "TODO"    #   old_parent_goal_id: "TODO"    #   new_goal_parent_id: "TODO"
    #   }
    # end)
    # |> Repo.transaction()
    # |> Repo.extract_result(:something)
  end
end

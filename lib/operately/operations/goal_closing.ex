defmodule Operately.Operations.GoalClosing do
  alias Ecto.Multi
  alias Operately.Repo
  alias Operately.Activities

  def run(creator, attrs) do
    raise "Operation for GoalClosing not implemented"

    # Multi.new()
    # |> Multi.insert(:something, ...)
    # |> Activities.insert(creator.id, :goal_closing, fn changes ->
    #   %{
    #   company_id: "TODO"    #   space_id: "TODO"    #   goal_id: "TODO"
    #   }
    # end)
    # |> Repo.transaction()
    # |> Repo.extract_result(:something)
  end
end

defmodule Operately.Operations.GoalDiscussionCreation do
  alias Ecto.Multi
  alias Operately.Repo
  alias Operately.Activities

  def run(creator, attrs) do
    raise "Operation for GoalDiscussionCreation not implemented"

    # Multi.new()
    # |> Multi.insert(:something, ...)
    # |> Activities.insert_sync(creator.id, :goal_discussion_creation, fn changes ->
    #   %{
    #   company_id: "TODO"    #   space_id: "TODO"    #   goal_id: "TODO"
    #   }
    # end)
    # |> Repo.transaction()
    # |> Repo.extract_result(:something)
  end
end

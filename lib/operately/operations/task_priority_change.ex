defmodule Operately.Operations.TaskPriorityChange do
  alias Ecto.Multi
  alias Operately.Repo
  alias Operately.Activities

  def run(creator, attrs) do
    raise "Operation for TaskPriorityChange not implemented"

    # Multi.new()
    # |> Multi.insert(:something, ...)
    # |> Activities.insert(creator.id, :task_priority_change, fn changes ->
    #   %{
    #   company_id: "TODO"    #   space_id: "TODO"    #   task_id: "TODO"    #   old_priority: "TODO"    #   new_priority: "TODO"
    #   }
    # end)
    # |> Repo.transaction()
    # |> Repo.extract_result(:something)
  end
end

defmodule Operately.Operations.TaskSizeChange do
  alias Ecto.Multi
  alias Operately.Repo
  alias Operately.Activities

  def run(creator, attrs) do
    raise "Operation for TaskSizeChange not implemented"

    # Multi.new()
    # |> Multi.insert(:something, ...)
    # |> Activities.insert(creator.id, :task_size_change, fn changes ->
    #   %{
    #   company_id: "TODO"    #   space_id: "TODO"    #   task_id: "TODO"    #   old_size: "TODO"    #   new_size: "TODO"
    #   }
    # end)
    # |> Repo.transaction()
    # |> Repo.extract_result(:something)
  end
end

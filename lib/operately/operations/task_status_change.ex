defmodule Operately.Operations.TaskStatusChange do
  alias Ecto.Multi
  alias Operately.Repo
  alias Operately.Activities

  def run(creator, attrs) do
    raise "Operation for TaskStatusChange not implemented"

    # Multi.new()
    # |> Multi.insert(:something, ...)
    # |> Activities.insert(creator.id, :task_status_change, fn changes ->
    #   %{
    #   company_id: "TODO"    #   task_id: "TODO"    #   status: "TODO"
    #   }
    # end)
    # |> Repo.transaction()
    # |> Repo.extract_result(:something)
  end
end

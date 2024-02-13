defmodule Operately.Operations.TaskClosing do
  alias Ecto.Multi
  alias Operately.Repo
  alias Operately.Activities

  def run(creator, attrs) do
    raise "Operation for TaskClosing not implemented"

    # Multi.new()
    # |> Multi.insert(:something, ...)
    # |> Activities.insert(creator.id, :task_closing, fn changes ->
    #   %{
    #   company_id: "TODO"    #   space_id: "TODO"    #   task_id: "TODO"
    #   }
    # end)
    # |> Repo.transaction()
    # |> Repo.extract_result(:something)
  end
end

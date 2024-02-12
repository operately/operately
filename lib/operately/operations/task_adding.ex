defmodule Operately.Operations.TaskAdding do
  alias Ecto.Multi
  alias Operately.Repo
  alias Operately.Activities

  def run(creator, attrs) do
    raise "Operation for TaskAdding not implemented"

    # Multi.new()
    # |> Multi.insert(:something, ...)
    # |> Repo.transaction()
    # |> Repo.extract_result(:goal)
  end
end

defmodule Operately.Operations.ProjectResuming do
  alias Ecto.Multi
  alias Operately.Repo
  alias Operately.Activities

  def run(creator, attrs) do
    raise "Operation for ProjectResuming not implemented"

    # Multi.new()
    # |> Multi.insert(:something, ...)
    # |> Activities.insert(creator.id, :project_resuming, fn changes ->
    #   %{
    #   company_id: "TODO"    #   project_id: "TODO"
    #   }
    # end)
    # |> Repo.transaction()
    # |> Repo.extract_result(:something)
  end
end

defmodule Operately.Operations.ProjectPausing do
  alias Ecto.Multi
  alias Operately.Repo
  alias Operately.Projects
  alias Operately.Activities

  def run(author, project) do
    changeset = Projects.Project.changeset(project, %{status: "paused"})

    Multi.new()
    |> Multi.update(:project, changeset)
    |> Activities.insert_sync(author.id, :project_pausing, fn _changes ->
      %{
        company_id: project.company_id,
        project_id: project.id,
      }
    end)
    |> Repo.transaction()
    |> Repo.extract_result(:project)
  end
end

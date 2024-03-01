defmodule Operately.Operations.ProjectResuming do
  alias Ecto.Multi
  alias Operately.Repo
  alias Operately.Projects
  alias Operately.Activities

  def run(author, project_id) do
    project = Operately.Projects.get_project!(project_id)
    changeset = Projects.Project.changeset(project, %{status: "active"})

    Multi.new()
    |> Multi.update(:project, changeset)
    |> Activities.insert_sync(author.id, :project_resuming, fn _changes ->
      %{
        company_id: project.company_id,
        project_id: project.id,
      }
    end)
    |> Repo.transaction()
    |> Repo.extract_result(:project)
  end
end

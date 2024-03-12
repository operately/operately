defmodule Operately.Operations.ProjectClosed do
  alias Ecto.Multi
  alias Operately.Repo
  alias Operately.Activities
  alias Operately.Projects.Project

  def run(author, project, retrospective) do
    change = Project.changeset(project, %{
      status: "closed",
      closed_at: DateTime.utc_now(),
      closed_by_id: author.id,
      retrospective: Jason.decode!(retrospective)
    })

    Multi.new()
    |> Multi.update(:project, change)
    |> Activities.insert(author.id, :project_closed, fn _changes -> %{
      company_id: project.company_id,
      project_id: project.id
    } end)
    |> Repo.transaction()
    |> Repo.extract_result(:project)
  end
end

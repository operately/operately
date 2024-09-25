defmodule Operately.Operations.ProjectClosed do
  alias Ecto.Multi
  alias Operately.Repo
  alias Operately.Activities
  alias Operately.Projects.{Project, Retrospective}

  def run(author, project, retrospective) do
    Multi.new()
    |> Multi.insert(:retrospective, Retrospective.changeset(%{
      author_id: author.id,
      project_id: project.id,
      content: Jason.decode!(retrospective),
      closed_at: DateTime.utc_now(),
    }))
    |> Multi.update(:project, fn changes ->
      Project.changeset(project,%{
        status: "closed",
        closed_at: changes.retrospective.closed_at,
      })
    end)
    |> Activities.insert_sync(author.id, :project_closed, fn _changes -> %{
      company_id: project.company_id,
      project_id: project.id
    } end)
    |> Repo.transaction()
    |> Repo.extract_result(:retrospective)
  end
end

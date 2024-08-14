defmodule Operately.Operations.ProjectGoalDisconnection do
  alias Ecto.Multi
  alias Operately.Activities
  alias Operately.Repo

  def run(person, project) do
    project_changeset = Operately.Projects.change_project(project, %{
      goal_id: nil
    })

    Multi.new()
    |> Multi.update(:project, project_changeset)
    |> Activities.insert_sync(person.id, :project_goal_disconnection, fn _ -> %{
      company_id: person.company_id,
      project_id: project.id,
      goal_id: project.goal_id
    } end)
    |> Repo.transaction()
    |> Repo.extract_result(:project)
  end
end

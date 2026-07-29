defmodule Operately.Operations.ProjectGoalConnection do
  alias Ecto.Multi
  alias Operately.Activities
  alias Operately.Repo
  alias Operately.Search.IndexUpdates
  alias Operately.Search.CoreWorkIndexUpdates

  def run(person, project, goal) do
    project_changeset = Operately.Projects.change_project(project, %{
      goal_id: goal.id
    })

    Multi.new()
    |> Multi.update(:project, project_changeset)
    |> Activities.insert_sync(person.id, :project_goal_connection, fn _ -> %{
      company_id: person.company_id,
      space_id: project.group_id,
      project_id: project.id,
      goal_id: goal.id
    } end)
    |> IndexUpdates.enqueue(:search_project, "project", project.id)
    |> CoreWorkIndexUpdates.enqueue_project(project.id)
    |> Repo.transaction()
    |> Repo.extract_result(:project)
  end

end

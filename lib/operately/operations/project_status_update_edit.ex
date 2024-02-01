defmodule Operately.Operations.ProjectStatusUpdateEdit do
  alias Ecto.Multi
  alias Operately.{Repo, Activities, Updates.Update, Projects.Project}
  alias Operately.Updates.Types.StatusUpdate

  def run(author, check_in, health, content) do
    action = :project_status_update_edit

    health = Jason.decode!(health)
    status = health["status"]["value"]
    project = Operately.Projects.get_project!(check_in.updatable_id)

    changeset = Update.changeset(check_in, %{
      content: StatusUpdate.build(project, health, content)
    })

    Multi.new()
    |> Multi.insert(:update, changeset)
    |> Multi.update(:project, Project.changeset(project, %{health: status}))
    |> Activities.insert(author.id, action, fn changes -> %{update_id: changes.update.id, project_id: changes.project.id} end)
    |> Repo.transaction()
    |> Repo.extract_result(:update)
  end
end

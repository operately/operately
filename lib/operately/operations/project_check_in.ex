defmodule Operately.Operations.ProjectCheckIn do
  alias Ecto.Multi
  alias Operately.{Repo, Activities, Updates.Update, Projects.Project}

  def run(author, project, status) do
    changeset = Update.changeset(%{
      updatable_type: :project,
      updatable_id: project.id,
      author_id: author.id,
      title: "",
      type: :check_in
    })

    next_check_in = Operately.Time.calculate_next_check_in(project.next_update_scheduled_at, DateTime.utc_now())

    Multi.new()
    |> Multi.insert(:update, changeset)
    |> Multi.update(:project, Project.changeset(project, %{health: status, next_update_scheduled_at: next_check_in}))
    |> Activities.insert(author.id, :project_check_in_submitted, fn changes -> %{update_id: changes.update.id, project_id: changes.project.id} end)
    |> Repo.transaction()
    |> Repo.extract_result(:update)
  end
end

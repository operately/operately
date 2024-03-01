defmodule Operately.Operations.ProjectCheckIn do
  alias Ecto.Multi

  alias Operately.Repo
  alias Operately.Activities
  alias Operately.Projects.Project
  alias Operately.Projects.CheckIn

  def run(author, project_id, status, description) do
    project = Operately.Projects.get_project!(project_id)
    next_check_in = Operately.Time.calculate_next_check_in(project.next_check_in_scheduled_at, DateTime.utc_now())

    Multi.new()
    |> Multi.insert(:check_in, fn _ ->
      CheckIn.changeset(%{
        author_id: author.id,
        project_id: project.id, 
        status: status, 
        description: description,
      })
    end)
    |> Multi.update(:project, fn changes ->
      Project.changeset(project, %{
        last_check_in_id: changes.check_in.id,
        last_check_in_status: changes.check_in.status,
        next_check_in_scheduled_at: next_check_in,
      })
    end)
    |> Activities.insert_sync(author.id, :project_check_in_submitted, fn changes -> 
      %{
        company_id: project.company_id,
        project_id: project.id,
        check_in_id: changes.check_in.id
      } 
    end)
    |> Repo.transaction()
    |> Repo.extract_result(:check_in)
  end
end

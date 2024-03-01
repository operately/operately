defmodule Operately.Operations.ProjectCheckInEdit do
  alias Ecto.Multi

  alias Operately.Activities
  alias Operately.Projects.Project
  alias Operately.Projects.CheckIn
  alias Operately.Repo

  def run(author, check_in_id, status, description) do
    check_in = Operately.Projects.get_check_in!(check_in_id)
    project = Operately.Projects.get_project!(check_in.project_id)

    Multi.new()
    |> Multi.update(:check_in, fn _ ->
      CheckIn.changeset(check_in, %{
        status: status, 
        description: description
      })
    end)
    |> Multi.update(:project, fn _ ->
      Project.changeset(project, %{
        last_check_in_status: status,
      })
    end)
    |> Activities.insert_sync(author.id, :project_check_in_edit, fn changes -> %{
      company_id: project.company_id,
      project_id: changes.project.id,
      check_in_id: check_in.id
    } end)
    |> Repo.transaction()
    |> Repo.extract_result(:check_in)
  end
end

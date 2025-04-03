defmodule Operately.Data.Change006SetLastCheckInOnProjects do
  import Ecto.Query, warn: false

  def run do
    projects = Operately.Repo.all(Operately.Projects.Project)
    Enum.each(projects, &set_last_check_in/1)
  end

  def set_last_check_in(project) do
    check_in = Operately.Repo.one(from c in Operately.Projects.CheckIn, where: c.project_id == ^project.id, order_by: [desc: c.inserted_at], limit: 1)

    if check_in do
      project
      |> Ecto.Changeset.change(last_check_in_id: check_in.id, last_check_in_status: check_in.status)
      |> Operately.Repo.update()
    end
  end

end

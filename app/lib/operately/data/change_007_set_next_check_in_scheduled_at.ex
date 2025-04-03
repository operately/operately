defmodule Operately.Data.Change007UpdateNextCheckInScheduledAt do
  import Ecto.Query, warn: false

  def run do
    projects = Operately.Repo.all(Operately.Projects.Project)
    Enum.each(projects, &update_next_check_in_scheduled_at/1)
  end

  def update_next_check_in_scheduled_at(project) do
    project
    |> Ecto.Changeset.change(next_check_in_scheduled_at: project.next_update_scheduled_at)
    |> Operately.Repo.update()
  end

end

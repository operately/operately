defmodule Operately.Repo.Migrations.AddClosedAtToExistingClosedProjects do
  use Ecto.Migration

  import Ecto.Query, only: [from: 2]

  alias Operately.{Repo, Projects}
  alias Operately.Projects.Project

  def up do
    from(c in "project_retrospectives", select: [:id, :project_id, :closed_at])
    |> Repo.all(with_deleted: true)
    |> Enum.each(fn retro ->
      {:ok, project_id} = Ecto.UUID.cast(retro.project_id)

      project = from(p in Project, where: p.id == ^project_id) |> Repo.one(with_deleted: true)

      if project.status == "closed" and project.closed_at == nil do
        {:ok, _} = Projects.update_project(project, %{closed_at: retro.closed_at})
      end
    end)
  end

  def down do

  end
end

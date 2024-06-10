defmodule Operately.Data.Change009CreateProjectsAccessContext do
  import Ecto.Query, only: [from: 2]

  alias Operately.Repo
  alias Operately.Access

  def run do
    projects = Repo.all(from p in Operately.Projects.Project, select: p.id)
    Enum.each(projects, &create_projects_access_contexts/1)
  end

  defp create_projects_access_contexts(project_id) do
    Access.create_context(%{project_id: project_id})
  end
end

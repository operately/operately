defmodule Operately.Data.Change009CreateProjectsAccessContext do
  import Ecto.Query, only: [from: 2]

  alias Operately.Repo
  alias Operately.Access

  def run do
    Repo.transaction(fn ->
      projects = Repo.all(from p in Operately.Projects.Project, select: p.id)

      Enum.each(projects, fn project_id ->
        case create_projects_access_contexts(project_id) do
          {:error, _} -> raise "Failed to create access context"
          _ -> :ok
        end
      end)
    end)
  end

  defp create_projects_access_contexts(project_id) do
    Access.create_context(%{project_id: project_id})
  end
end

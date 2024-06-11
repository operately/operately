defmodule Operately.Data.Change009CreateProjectsAccessContext do
  import Ecto.Query, only: [from: 2]

  alias Operately.Repo
  alias Operately.Access
  alias Operately.Projects.Project
  alias Operately.Access.Context

  def run do
    Repo.transaction(fn ->
      projects = Repo.all(from p in Project, select: p.id)

      Enum.each(projects, fn project_id ->
        case create_projects_access_contexts(project_id) do
          {:error, _} -> raise "Failed to create access context"
          _ -> :ok
        end
      end)
    end)
  end

  defp create_projects_access_contexts(project_id) do
    existing_context = Repo.one(from c in Context, where: c.project_id == ^project_id, select: c.id)

    if existing_context do
      :ok
    else
      Access.create_context(%{project_id: project_id})
    end
  end
end

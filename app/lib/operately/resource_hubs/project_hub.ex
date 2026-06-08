defmodule Operately.ResourceHubs.ProjectHub do
  import Ecto.Query, only: [from: 2]

  alias Operately.Access
  alias Operately.Projects.Project
  alias Operately.Repo
  alias Operately.ResourceHubs.ResourceHub

  @name "Documents & Files"

  def create_for_project(project = %Project{}) do
    with {:ok, hub} <- find_or_create_hub(project),
         {:ok, _context} <- ensure_context(hub) do
      {:ok, hub}
    end
  end

  def get_project_hub(project_id) do
    Repo.one(from(h in ResourceHub, where: h.project_id == ^project_id))
  end

  defp find_or_create_hub(project) do
    case get_project_hub(project.id) do
      nil ->
        ResourceHub.changeset(%{
          project_id: project.id,
          name: @name,
          description: %{}
        })
        |> Repo.insert()

      hub ->
        {:ok, hub}
    end
  end

  defp ensure_context(hub) do
    case Access.get_context(resource_hub_id: hub.id) do
      nil -> Access.create_context(%{resource_hub_id: hub.id})
      context -> {:ok, context}
    end
  end
end

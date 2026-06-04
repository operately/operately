defmodule Operately.ResourceHubs.ProjectHub do
  import Ecto.Query, only: [from: 2]

  alias Operately.Access
  alias Operately.Access.{Binding, Context}
  alias Operately.Projects.Project
  alias Operately.Repo
  alias Operately.ResourceHubs.ResourceHub

  @name "Docs & Files"

  def create_for_project(project = %Project{}) do
    with {:ok, hub} <- find_or_create_hub(project),
         {:ok, _context} <- ensure_context(hub),
         {:ok, _} <- sync_access_from_project(project.id) do
      {:ok, hub}
    end
  end

  def sync_access_from_project(project_id) do
    with hub when not is_nil(hub) <- get_project_hub(project_id),
         %Context{} = project_context <- Access.get_context(project_id: project_id),
         %Context{} = hub_context <- Access.get_context(resource_hub_id: hub.id) do
      copy_bindings(project_context, hub_context)
    else
      nil -> {:ok, :skipped}
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

  defp copy_bindings(project_context, hub_context) do
    Repo.delete_all(from(b in Binding, where: b.context_id == ^hub_context.id))

    from(b in Binding, where: b.context_id == ^project_context.id)
    |> Repo.all()
    |> Enum.each(fn binding ->
      Binding.changeset(%{
        context_id: hub_context.id,
        group_id: binding.group_id,
        access_level: binding.access_level,
        tag: binding.tag
      })
      |> Repo.insert!()
    end)

    {:ok, :synced}
  end
end

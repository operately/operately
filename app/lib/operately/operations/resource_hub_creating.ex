defmodule Operately.Operations.ResourceHubCreating do
  import Ecto.Query, only: [from: 2]

  alias Ecto.Multi
  alias Operately.{Activities, Repo}
  alias Operately.Groups.Group
  alias Operately.Repo.Locking
  alias Operately.ResourceHubs.{Parent, ResourceHub}

  def run(author, parent, attrs) do
    Multi.new()
    |> Multi.run(:parent, fn repo, _ -> lock_parent(repo, parent) end)
    |> Multi.run(:position, fn repo, %{parent: current} -> {:ok, next_position(repo, current)} end)
    |> Multi.insert(:resource_hub, fn %{parent: current, position: position} ->
      ResourceHub.changeset(%{
        name: attrs.name,
        description: attrs.description,
      } |> Map.merge(Parent.resource_hub_fields(current)))
      |> Ecto.Changeset.put_change(:position, position)
    end)
    |> Activities.insert_sync(author.id, :resource_hub_created, fn changes ->
      %{
        resource_hub_id: changes.resource_hub.id,
        name: changes.resource_hub.name,
      }
      |> Map.merge(Parent.parent_fields(changes.parent))
    end)
    |> Repo.transaction()
    |> Repo.extract_result(:resource_hub)
  end

  defp lock_parent(repo, %Group{} = space), do: Locking.lock_for_update(repo, space)
  defp lock_parent(_repo, parent), do: {:ok, parent}

  defp next_position(repo, %Group{} = space) do
    max_position = repo.one(from h in ResourceHub, where: h.space_id == ^space.id, select: max(h.position))
    (max_position || -1) + 1
  end

  defp next_position(_repo, _parent), do: 0
end

defmodule Operately.Operations.ResourceHubRenaming do
  alias Ecto.Multi
  alias Operately.{Activities, Repo}
  alias Operately.Repo.Locking
  alias Operately.ResourceHubs.{Parent, ResourceHub}

  def run(author, hub, new_name) do
    name = String.trim(new_name)

    Multi.new()
    |> Multi.run(:locked_hub, fn repo, _ -> Locking.lock_for_update(repo, hub) end)
    |> Multi.merge(fn %{locked_hub: current} -> rename(author, current, name) end)
    |> Repo.transaction()
    |> normalize_result()
  end

  defp rename(author, hub, name) do
    changeset = ResourceHub.changeset(hub, %{name: name})

    if changeset.valid? and name == hub.name do
      Multi.put(Multi.new(), :hub, hub)
    else
      Multi.new()
      |> Multi.update(:hub, changeset)
      |> Activities.insert_sync(author.id, :resource_hub_renamed, fn changes ->
        Parent.parent_fields(hub)
        |> Map.merge(%{resource_hub_id: hub.id, old_name: hub.name, new_name: changes.hub.name})
      end)
    end
  end

  defp normalize_result({:ok, changes}), do: {:ok, changes}
  defp normalize_result({:error, _step, error, _changes}), do: {:error, error}
end

defmodule Operately.Operations.ResourceHubFolderCreating do
  alias Ecto.Multi
  alias Operately.Repo
  alias Operately.Activities
  alias Operately.ResourceHubs.Parent
  alias Operately.ResourceHubs.{Folder, Node}

  def run(author, hub, attrs) do
    Multi.new()
    |> Multi.insert(:node, Node.changeset(%{
      resource_hub_id: hub.id,
      parent_folder_id: attrs.parent_folder_id,
      type: :folder,
    }))
    |> Multi.insert(:folder, fn changes ->
      Folder.changeset(%{
        node_id: changes.node.id,
        name: attrs.name,
      })
    end)
    |> Multi.run(:folder_with_node, fn _, changes ->
      folder = Map.put(changes.folder, :node, changes.node)
      {:ok, folder}
    end)
    |> Activities.insert_sync(author.id, :resource_hub_folder_created, fn changes ->
      %{
        resource_hub_id: hub.id,
        node_id: changes.node.id,
        folder_id: changes.folder.id,
        resource_name: attrs.name,
      }
      |> Map.merge(Parent.parent_fields(hub))
    end)
    |> Repo.transaction()
    |> Repo.extract_result(:folder_with_node)
  end
end

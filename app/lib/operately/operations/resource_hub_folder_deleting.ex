defmodule Operately.Operations.ResourceHubFolderDeleting do
  alias Ecto.Multi
  alias Operately.Repo
  alias Operately.Activities
  alias Operately.ResourceHubs.Parent
  alias Operately.Search.ResourceHubIndex

  def run(author, folder) do
    Multi.new()
    |> Multi.run(:folder, fn _, _ -> Repo.soft_delete(folder) end)
    |> Multi.run(:node, fn _, _ -> Repo.soft_delete(folder.node) end)
    |> ResourceHubIndex.delete_folder_tree(:search_folder_tree, folder.id)
    |> Activities.insert_sync(author.id, :resource_hub_folder_deleted, fn _changes ->
      %{
        resource_hub_id: folder.resource_hub.id,
        node_id: folder.node_id,
        folder_id: folder.id,
      }
      |> Map.merge(Parent.parent_fields(folder.resource_hub))
    end)
    |> Repo.transaction()
    |> Repo.extract_result(:folder)
  end
end

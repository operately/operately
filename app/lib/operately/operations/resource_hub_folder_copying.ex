defmodule Operately.Operations.ResourceHubFolderCopying do
  alias Ecto.Multi
  alias Operately.{Repo, Activities}
  alias Operately.ResourceHubs.Parent
  alias Operately.Search.ResourceHubIndex
  alias Operately.Operations.ResourceHubFolderCopying.{
    Folders,
    Nodes,
    Resources,
    SubscriptionsLists,
    Subscriptions,
  }

  def run(author, folder, dest_resource_hub, attrs) do
    Multi.new()
    |> Multi.run(:folder_and_nodes, fn _, _ ->
      Folders.copy(folder, dest_resource_hub, attrs)
    end)
    |> Multi.run(:nodes, fn _, changes ->
      {_, nodes} = changes.folder_and_nodes
      Nodes.copy(nodes, dest_resource_hub)
    end)
    |> Multi.run(:nodes_with_subscription_lists, fn _, changes ->
      SubscriptionsLists.copy(changes.nodes)
    end)
    |> Multi.run(:nodes_with_subscriptions, fn _, changes ->
      Subscriptions.copy(changes.nodes_with_subscription_lists)
    end)
    |> Multi.run(:resources, fn _, changes ->
      Resources.copy(changes.nodes_with_subscriptions)
    end)
    |> Multi.run(:updated_subscription_lists, fn _, changes ->
      SubscriptionsLists.update_parent_ids(changes.resources)
    end)
    |> Multi.run(:new_folder, fn _, changes ->
      {new_folder, _} = changes.folder_and_nodes
      {:ok, new_folder}
    end)
    |> ResourceHubIndex.enqueue_folder_tree(:search_folder_tree, fn changes -> changes.new_folder.id end)
    |> insert_activity(author, folder, dest_resource_hub)
    |> Repo.transaction()
    |> Repo.extract_result(:new_folder)
  end

  defp insert_activity(multi, author, folder, dest_resource_hub) do
    multi
    |> Activities.insert_sync(author.id, :resource_hub_folder_copied, fn changes ->
      %{
        resource_hub_id: dest_resource_hub.id,
        node_id: changes.new_folder.node_id,
        folder_id: changes.new_folder.id,
        original_folder: %{
          resource_hub_id: folder.resource_hub.id,
          node_id: folder.node_id,
          folder_id: folder.id,
        }
        |> Map.merge(Parent.parent_fields(folder.resource_hub)),
      }
      |> Map.merge(Parent.parent_fields(dest_resource_hub))
    end)
  end
end

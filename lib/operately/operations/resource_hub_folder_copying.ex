defmodule Operately.Operations.ResourceHubFolderCopying do
  alias Ecto.Multi
  alias Operately.{Repo, Activities}
  alias Operately.Operations.ResourceHubFolderCopying.{
    Folders,
    Nodes,
    Resources,
    SubscriptionsLists,
    Subscriptions,
  }

  def run(author, folder, dest_resource_hub, dest_parent_folder_id \\ nil) do
    Multi.new()
    |> Multi.run(:folder_and_nodes, fn _, _ ->
      Folders.copy(folder, dest_resource_hub, dest_parent_folder_id)
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
    |> insert_activity(author, folder, dest_resource_hub)
    |> Repo.transaction()
    |> Repo.extract_result(:new_folder)
  end

  defp insert_activity(multi, author, folder, dest_resource_hub) do
    multi
    |> Activities.insert_sync(author.id, :resource_hub_folder_copied, fn changes ->
      %{
        company_id: author.company_id,
        space_id: dest_resource_hub.space_id,
        resource_hub_id: dest_resource_hub.id,
        node_id: changes.new_folder.node_id,
        folder_id: changes.new_folder.id,
        original_folder: %{
          space_id: folder.resource_hub.space_id,
          resource_hub_id: folder.resource_hub.id,
          node_id: folder.node_id,
          folder_id: folder.id,
        },
      }
    end)
  end
end

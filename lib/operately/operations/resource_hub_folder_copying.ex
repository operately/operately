defmodule Operately.Operations.ResourceHubFolderCopying do
  alias Ecto.Multi
  alias Operately.Repo
  alias Operately.Operations.ResourceHubFolderCopying.{
    Folders,
    Nodes,
    Resources,
    SubscriptionsLists,
    Subscriptions,
  }

  def run(resource_hub, folder) do
    Multi.new()
    |> Multi.run(:folder_and_nodes, fn _, _ ->
      Folders.copy(folder)
    end)
    |> Multi.run(:nodes, fn _, changes ->
      {_, nodes} = changes.folder_and_nodes
      Nodes.copy(nodes, resource_hub)
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
    |> Repo.transaction()
  end
end

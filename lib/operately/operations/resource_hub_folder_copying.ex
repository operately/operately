defmodule Operately.Operations.ResourceHubFolderCopying do
  alias Operately.Repo
  alias Operately.Operations.ResourceHubFolderCopying.{
    Folders,
    Nodes,
    Resources,
    SubscriptionsLists,
    Subscriptions,
  }

  def run(resource_hub, folder) do
    Repo.transaction(fn ->
      folder
      |> Folders.copy()
      |> Nodes.copy(resource_hub)
      |> SubscriptionsLists.copy()
      |> Subscriptions.copy()
      |> Resources.copy()
      |> SubscriptionsLists.update_parent_ids()
    end)
  end
end

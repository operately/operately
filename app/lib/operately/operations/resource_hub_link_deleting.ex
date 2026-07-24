defmodule Operately.Operations.ResourceHubLinkDeleting do
  alias Ecto.Multi
  alias Operately.Repo
  alias Operately.Activities
  alias Operately.ResourceHubs.Parent
  alias Operately.Search.ResourceHubIndex

  def run(author, link) do
    Multi.new()
    |> Multi.run(:link, fn _, _ -> Repo.soft_delete(link) end)
    |> Multi.run(:node, fn _, _ -> Repo.soft_delete(link.node) end)
    |> ResourceHubIndex.delete_resource(:search_link, :link, link.id)
    |> Activities.insert_sync(author.id, :resource_hub_link_deleted, fn _changes ->
      %{
        resource_hub_id: link.resource_hub.id,
        node_id: link.node_id,
        link_id: link.id,
      }
      |> Map.merge(Parent.parent_fields(link.resource_hub))
    end)
    |> Repo.transaction()
    |> Repo.extract_result(:link)
  end
end

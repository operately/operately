defmodule Operately.Operations.ResourceHubLinkDeleting do
  alias Ecto.Multi
  alias Operately.Repo
  alias Operately.Activities

  def run(author, link) do
    Multi.new()
    |> Multi.run(:link, fn _, _ -> Repo.soft_delete(link) end)
    |> Multi.run(:node, fn _, _ -> Repo.soft_delete(link.node) end)
    |> Activities.insert_sync(author.id, :resource_hub_link_deleted, fn _changes ->
      %{
        company_id: author.company_id,
        space_id: link.resource_hub.space_id,
        resource_hub_id: link.resource_hub.id,
        node_id: link.node_id,
        link_id: link.id,
      }
    end)
    |> Repo.transaction()
    |> Repo.extract_result(:link)
  end
end

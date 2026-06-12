defmodule Operately.Operations.ResourceHubDocumentDeleting do
  alias Ecto.Multi
  alias Operately.Repo
  alias Operately.Activities
  alias Operately.ResourceHubs.Parent

  def run(author, document) do
    Multi.new()
    |> Multi.run(:document, fn _, _ -> Repo.soft_delete(document) end)
    |> Multi.run(:node, fn _, _ -> Repo.soft_delete(document.node) end)
    |> Activities.insert_sync(author.id, :resource_hub_document_deleted, fn _changes ->
      %{
        resource_hub_id: document.resource_hub.id,
        node_id: document.node_id,
        document_id: document.id,
      }
      |> Map.merge(Parent.parent_fields(document.resource_hub))
    end)
    |> Repo.transaction()
    |> Repo.extract_result(:document)
  end
end

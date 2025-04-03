defmodule Operately.Operations.ResourceHubDocumentDeleting do
  alias Ecto.Multi
  alias Operately.Repo
  alias Operately.Activities

  def run(author, document) do
    Multi.new()
    |> Multi.run(:document, fn _, _ -> Repo.soft_delete(document) end)
    |> Multi.run(:node, fn _, _ -> Repo.soft_delete(document.node) end)
    |> Activities.insert_sync(author.id, :resource_hub_document_deleted, fn _changes ->
      %{
        company_id: author.company_id,
        space_id: document.resource_hub.space_id,
        resource_hub_id: document.resource_hub.id,
        node_id: document.node_id,
        document_id: document.id,
      }
    end)
    |> Repo.transaction()
    |> Repo.extract_result(:document)
  end
end

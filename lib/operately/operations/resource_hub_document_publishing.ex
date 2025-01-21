defmodule Operately.Operations.ResourceHubDocumentPublishing do
  alias Ecto.Multi
  alias Operately.{Activities, Repo}
  alias Operately.ResourceHubs.Document

  def run(author, document) do
    Multi.new()
    |> Multi.update(:document, Document.changeset(document, %{state: :published}))
    |> Activities.insert_sync(author.id, :resource_hub_document_created, fn _changes -> %{
      company_id: author.company_id,
      space_id: document.resource_hub.space_id,
      resource_hub_id: document.resource_hub.id,
      document_id: document.id,
      node_id: document.node_id,
      name: document.node.name,
    } end)
    |> Repo.transaction()
    |> Repo.extract_result(:document)
  end
end

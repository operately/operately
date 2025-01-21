defmodule Operately.Operations.ResourceHubDocumentPublishing do
  alias Ecto.Multi
  alias Operately.{Activities, Repo}
  alias Operately.ResourceHubs.{Document, Node}

  def run(author, document, attrs) do
    Multi.new()
    |> Multi.update(:node, Node.changeset(document.node, %{name: attrs.name}))
    |> Multi.update(:document, Document.changeset(document, %{
      state: :published,
      content: attrs.content,
    }))
    |> Multi.run(:document_with_node, fn _, changes ->
      document = Map.put(changes.document, :node, changes.node)
      {:ok, document}
    end)
    |> Activities.insert_sync(author.id, :resource_hub_document_created, fn _changes -> %{
      company_id: author.company_id,
      space_id: document.resource_hub.space_id,
      resource_hub_id: document.resource_hub.id,
      document_id: document.id,
      node_id: document.node_id,
      name: document.node.name,
    } end)
    |> Repo.transaction()
    |> Repo.extract_result(:document_with_node)
  end
end

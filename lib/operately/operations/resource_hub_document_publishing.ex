defmodule Operately.Operations.ResourceHubDocumentPublishing do
  alias Ecto.Multi
  alias Operately.{Activities, Repo}
  alias Operately.ResourceHubs.{Document, Node}

  def run(author, document, attrs) do
    Multi.new()
    |> update_document(document, attrs[:content])
    |> update_node(document.node, attrs[:name])
    |> insert_activity(author, document)
    |> Repo.transaction()
    |> Repo.extract_result(:result)
  end

  defp insert_activity(multi, author, document) do
    Activities.insert_sync(multi, author.id, :resource_hub_document_created, fn _changes -> %{
      company_id: author.company_id,
      space_id: document.resource_hub.space_id,
      resource_hub_id: document.resource_hub.id,
      document_id: document.id,
      node_id: document.node_id,
      name: document.node.name,
    } end)
  end

  defp update_document(multi, document, nil) do
    Multi.update(multi, :document, Document.changeset(document, %{state: :published}))
  end

  defp update_document(multi, document, content) do
    Multi.update(multi, :document, Document.changeset(document, %{
      state: :published,
      content: content,
    }))
  end

  defp update_node(multi, node, nil) do
    Multi.run(multi, :result, fn _, _ -> {:ok, node} end)
  end

  defp update_node(multi, node, name) do
    multi
    |> Multi.update(:node, Node.changeset(node, %{name: name}))
    |> Multi.run(:result, fn _, changes ->
      document = Map.put(changes.document, :node, changes.node)
      {:ok, document}
    end)
  end
end

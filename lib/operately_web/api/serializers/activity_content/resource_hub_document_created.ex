defimpl OperatelyWeb.Api.Serializable, for: Operately.Activities.Content.ResourceHubDocumentCreated do
  alias OperatelyWeb.Api.Serializer

  def serialize(content, level: :essential) do
    document = Map.put(content["document"], :node, content["node"])
    copied_document = get_copied_document(content)

    %{
      resource_hub: Serializer.serialize(content["resource_hub"], level: :essential),
      document: Serializer.serialize(document, level: :essential),
      copied_document: Serializer.serialize(copied_document, level: :essential),
    }
  end

  defp get_copied_document(content) do
    if Ecto.assoc_loaded?(content["copied_document"]) do
      Map.put(content["copied_document"], :node, content["copied_document_node"])
    end
  end
end

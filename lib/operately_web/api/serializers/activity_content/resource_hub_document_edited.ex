defimpl OperatelyWeb.Api.Serializable, for: Operately.Activities.Content.ResourceHubDocumentEdited do
  alias OperatelyWeb.Api.Serializer

  def serialize(content, level: :essential) do
    document = Map.put(content["document"], :node, content["node"])

    %{
      document: Serializer.serialize(document, level: :essential),
      resource_hub: Serializer.serialize(content["resource_hub"], level: :essential)
    }
  end
end

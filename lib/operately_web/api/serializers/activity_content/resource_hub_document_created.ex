defimpl OperatelyWeb.Api.Serializable, for: Operately.Activities.Content.ResourceHubDocumentCreated do
  alias OperatelyWeb.Api.Serializer

  def serialize(content, level: :essential) do
    document = Map.put(content["document"], :node, content["node"])

    %{
      resource_hub: Serializer.serialize(content["resource_hub"], level: :essential),
      document: Serializer.serialize(document, level: :essential),
    }
  end
end

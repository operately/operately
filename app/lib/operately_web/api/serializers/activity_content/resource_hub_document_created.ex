defimpl OperatelyWeb.Api.Serializable, for: Operately.Activities.Content.ResourceHubDocumentCreated do
  alias OperatelyWeb.Api.Serializer
  alias OperatelyWeb.Api.Serializers.ResourceHubActivity

  def serialize(content, level: :essential) do
    copied_document = get_copied_document(content)

    ResourceHubActivity.parent_fields(content)
    |> Map.merge(%{
      document: ResourceHubActivity.serialize_resource(content, "document"),
      copied_document: Serializer.serialize(copied_document, level: :essential),
    })
  end

  defp get_copied_document(content) do
    content["copied_document"]
    |> ResourceHubActivity.attach_node(content["copied_document_node"])
  end
end

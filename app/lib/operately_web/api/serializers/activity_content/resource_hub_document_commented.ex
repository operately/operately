defimpl OperatelyWeb.Api.Serializable, for: Operately.Activities.Content.ResourceHubDocumentCommented do
  alias OperatelyWeb.Api.Serializer
  alias OperatelyWeb.Api.Serializers.ResourceHubActivity

  def serialize(content, level: :essential) do
    ResourceHubActivity.parent_fields(content)
    |> Map.merge(%{
      document: ResourceHubActivity.serialize_resource(content, "document"),
      comment: Serializer.serialize(content["comment"], level: :essential),
    })
  end
end

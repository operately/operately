defimpl OperatelyWeb.Api.Serializable, for: Operately.Activities.Content.ResourceHubFileCommented do
  alias OperatelyWeb.Api.Serializer
  alias OperatelyWeb.Api.Serializers.ResourceHubActivity

  def serialize(content, level: :essential) do
    ResourceHubActivity.parent_fields(content)
    |> Map.merge(%{
      file: ResourceHubActivity.serialize_resource(content, "file"),
      comment: Serializer.serialize(content["comment"], level: :essential),
    })
  end
end

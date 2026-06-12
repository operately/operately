defimpl OperatelyWeb.Api.Serializable, for: Operately.Activities.Content.ResourceHubLinkCommented do
  alias OperatelyWeb.Api.Serializer
  alias OperatelyWeb.Api.Serializers.ResourceHubActivity

  def serialize(content, level: :essential) do
    ResourceHubActivity.parent_fields(content)
    |> Map.merge(%{
      link: ResourceHubActivity.serialize_resource(content, "link"),
      comment: Serializer.serialize(content["comment"], level: :essential),
    })
  end
end

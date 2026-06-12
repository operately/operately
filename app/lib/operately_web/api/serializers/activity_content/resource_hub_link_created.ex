defimpl OperatelyWeb.Api.Serializable, for: Operately.Activities.Content.ResourceHubLinkCreated do
  alias OperatelyWeb.Api.Serializers.ResourceHubActivity

  def serialize(content, level: :essential) do
    ResourceHubActivity.parent_fields(content)
    |> Map.merge(%{
      link: ResourceHubActivity.serialize_resource(content, "link"),
    })
  end
end

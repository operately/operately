defimpl OperatelyWeb.Api.Serializable, for: Operately.Activities.Content.ResourceHubCreated do
  alias OperatelyWeb.Api.Serializer
  alias OperatelyWeb.Api.Serializers.ResourceHubActivity

  def serialize(content, level: :essential) do
    ResourceHubActivity.parent_fields(content)
    |> Map.merge(%{
      name: Serializer.serialize(content["name"], level: :essential),
    })
  end
end

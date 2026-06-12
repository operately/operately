defimpl OperatelyWeb.Api.Serializable, for: Operately.Activities.Content.ResourceHubFileEdited do
  alias OperatelyWeb.Api.Serializers.ResourceHubActivity

  def serialize(content, level: :essential) do
    ResourceHubActivity.parent_fields(content)
    |> Map.merge(%{
      file: ResourceHubActivity.serialize_resource(content, "file"),
    })
  end
end

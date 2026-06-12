defimpl OperatelyWeb.Api.Serializable, for: Operately.Activities.Content.ResourceHubFolderRenamed do
  alias OperatelyWeb.Api.Serializer
  alias OperatelyWeb.Api.Serializers.ResourceHubActivity

  def serialize(content, level: :essential) do
    ResourceHubActivity.parent_fields(content)
    |> Map.merge(%{
      folder: ResourceHubActivity.serialize_resource(content, "folder"),
      old_name: Serializer.serialize(content["old_name"], level: :essential),
      new_name: Serializer.serialize(content["new_name"], level: :essential),
    })
  end
end

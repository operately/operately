defimpl OperatelyWeb.Api.Serializable, for: Operately.Activities.Content.ResourceHubParentFolderEdited do
  alias OperatelyWeb.Api.Serializer
  alias OperatelyWeb.Api.Serializers.ResourceHubActivity

  def serialize(content, level: :essential) do
    ResourceHubActivity.parent_fields(content)
    |> Map.merge(%{
      new_folder: ResourceHubActivity.serialize_resource(content, "new_folder"),
      resource_id: Serializer.serialize(content["resource_id"], level: :essential),
      resource_type: Serializer.serialize(content["resource_type"], level: :essential),
    })
  end
end

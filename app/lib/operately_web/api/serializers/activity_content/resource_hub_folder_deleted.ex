defimpl OperatelyWeb.Api.Serializable, for: Operately.Activities.Content.ResourceHubFolderDeleted do
  alias OperatelyWeb.Api.Serializers.ResourceHubActivity

  def serialize(content, level: :essential) do
    ResourceHubActivity.parent_fields(content)
    |> Map.merge(%{
      folder: ResourceHubActivity.serialize_resource(content, "folder"),
    })
  end
end

defimpl OperatelyWeb.Api.Serializable, for: Operately.Activities.Content.ResourceHubFolderCopied do
  alias OperatelyWeb.Api.Serializer
  alias OperatelyWeb.Api.Serializers.ResourceHubActivity

  def serialize(content, level: :essential) do
    original_folder = get_original_folder(content)

    ResourceHubActivity.parent_fields(content)
    |> Map.merge(%{
      folder: ResourceHubActivity.serialize_resource(content, "folder"),
      original_folder: Serializer.serialize(original_folder, level: :essential)
    })
  end

  defp get_original_folder(content) do
    case content["original_folder"] do
      nil ->
        nil

      original_folder ->
        original_folder["folder"]
        |> ResourceHubActivity.attach_node(original_folder["node"])
    end
  end
end

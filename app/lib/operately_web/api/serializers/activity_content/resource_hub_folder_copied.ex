defimpl OperatelyWeb.Api.Serializable, for: Operately.Activities.Content.ResourceHubFolderCopied do
  alias OperatelyWeb.Api.Serializer

  def serialize(content, level: :essential) do
    original_folder = get_original_folder(content)
    folder = Map.put(content["folder"], :node, content["node"])

    %{
      space: Serializer.serialize(content["space"], level: :essential),
      resource_hub: Serializer.serialize(content["resource_hub"], level: :essential),
      folder: Serializer.serialize(folder, level: :essential),
      original_folder: Serializer.serialize(original_folder, level: :essential)
    }
  end

  defp get_original_folder(content) do
    original_folder = content["original_folder"]
    Map.put(original_folder["folder"], :node, original_folder["node"])
  end
end

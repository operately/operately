defimpl OperatelyWeb.Api.Serializable, for: Operately.Activities.Content.ResourceHubFolderDeleted do
  alias OperatelyWeb.Api.Serializer

  def serialize(content, level: :essential) do
    folder = Map.put(content["folder"], :node, content["node"])

    %{
      resource_hub: Serializer.serialize(content["resource_hub"], level: :essential),
      folder: Serializer.serialize(folder, level: :essential),
    }
  end
end

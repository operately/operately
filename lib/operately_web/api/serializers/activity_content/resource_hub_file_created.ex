defimpl OperatelyWeb.Api.Serializable, for: Operately.Activities.Content.ResourceHubFileCreated do
  alias OperatelyWeb.Api.Serializer

  def serialize(content, level: :essential) do
    %{
      resource_hub: Serializer.serialize(content["resource_hub"], level: :essential),
      space: Serializer.serialize(content["space"], level: :essential),
      files: Enum.map(content["files"], fn f ->
        file = Map.put(f["file"], :node, f["node"])
        Serializer.serialize(file, level: :essential)
      end)
    }
  end
end

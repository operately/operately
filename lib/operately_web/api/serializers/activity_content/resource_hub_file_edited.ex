defimpl OperatelyWeb.Api.Serializable, for: Operately.Activities.Content.ResourceHubFileEdited do
  alias OperatelyWeb.Api.Serializer

  def serialize(content, level: :essential) do
    file = Map.put(content["file"], :node, content["node"])

    %{
      resource_hub: Serializer.serialize(content["resource_hub"], level: :essential),
      file: Serializer.serialize(file, level: :essential),
    }
  end
end

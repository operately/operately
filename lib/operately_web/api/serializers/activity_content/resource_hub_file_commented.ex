defimpl OperatelyWeb.Api.Serializable, for: Operately.Activities.Content.ResourceHubFileCommented do
  alias OperatelyWeb.Api.Serializer

  def serialize(content, level: :essential) do
    file = Map.put(content["file"], :node, content["node"])

    %{
      file: Serializer.serialize(file, level: :essential),
      comment: Serializer.serialize(content["comment"], level: :essential),
    }
  end
end

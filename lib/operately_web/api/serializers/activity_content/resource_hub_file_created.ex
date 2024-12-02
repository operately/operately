defimpl OperatelyWeb.Api.Serializable, for: Operately.Activities.Content.ResourceHubFileCreated do
  alias OperatelyWeb.Api.Serializer

  def serialize(content, level: :essential) do
    %{
      file_id: OperatelyWeb.Paths.file_id(content["file"]),
      file_name: content["file_name"],
      resource_hub: Serializer.serialize(content["resource_hub"], level: :essential),
    }
  end
end

defimpl OperatelyWeb.Api.Serializable, for: Operately.Activities.Content.ResourceHubFileCreated do
  alias OperatelyWeb.Api.Serializer
  alias OperatelyWeb.Api.Serializers.ResourceHubActivity

  def serialize(content, level: :essential) do
    ResourceHubActivity.parent_fields(content)
    |> Map.merge(%{
      files:
        case content["files"] do
          nil ->
            nil

          files ->
            Enum.map(files, fn f ->
              f
              |> then(& &1["file"])
              |> ResourceHubActivity.attach_node(f["node"])
              |> Serializer.serialize(level: :essential)
            end)
        end
    })
  end
end

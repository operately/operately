defimpl OperatelyWeb.Api.Serializable, for: Operately.Activities.Content.ResourceHubDeleted do
  alias OperatelyWeb.Api.Serializer

  def serialize(content, level: :essential) do
    %{
      space: Serializer.serialize(content["space"]),
      resource_hub: Serializer.serialize(content["resource_hub"]),
      name: content["name"]
    }
  end
end

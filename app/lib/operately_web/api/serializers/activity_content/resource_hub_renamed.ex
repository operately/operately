defimpl OperatelyWeb.Api.Serializable, for: Operately.Activities.Content.ResourceHubRenamed do
  alias OperatelyWeb.Api.Serializer

  def serialize(content, level: :essential) do
    %{
      space: Serializer.serialize(content["space"], level: :essential),
      resource_hub: Serializer.serialize(content["resource_hub"], level: :essential),
      old_name: content["old_name"],
      new_name: content["new_name"]
    }
  end
end

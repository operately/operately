defimpl OperatelyWeb.Api.Serializable, for: Operately.Activities.Content.ResourceHubLinkDeleted do
  alias OperatelyWeb.Api.Serializer

  def serialize(content, level: :essential) do
    link = Map.put(content["link"], :node, content["node"])

    %{
      resource_hub: Serializer.serialize(content["resource_hub"], level: :essential),
      space: Serializer.serialize(content["space"], level: :essential),
      link: Serializer.serialize(link, level: :essential),
    }
  end
end

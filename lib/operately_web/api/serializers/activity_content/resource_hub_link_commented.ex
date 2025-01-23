defimpl OperatelyWeb.Api.Serializable, for: Operately.Activities.Content.ResourceHubLinkCommented do
  alias OperatelyWeb.Api.Serializer

  def serialize(content, level: :essential) do
    link = Map.put(content["link"], :node, content["node"])

    %{
      space: Serializer.serialize(content["space"], level: :essential),
      link: Serializer.serialize(link, level: :essential),
      comment: Serializer.serialize(content["comment"], level: :essential),
    }
  end
end

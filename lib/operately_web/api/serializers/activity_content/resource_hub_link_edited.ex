defimpl OperatelyWeb.Api.Serializable, for: Operately.Activities.Content.ResourceHubLinkEdited do
  alias OperatelyWeb.Api.Serializer

  def serialize(content, level: :essential) do
    link = Map.put(content["link"], :node, content["node"])

    %{
      resource_hub: Serializer.serialize(content["resource_hub"], level: :essential),
      space: Serializer.serialize(content["space"], level: :essential),
      link: Serializer.serialize(link, level: :essential),

      previous_name: content["previous_link"][:name],
      previous_type: content["previous_link"][:type],
      previous_url: content["previous_link"][:url],
    }
  end
end

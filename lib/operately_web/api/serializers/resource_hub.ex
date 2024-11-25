defimpl OperatelyWeb.Api.Serializable, for: Operately.ResourceHubs.ResourceHub do
  def serialize(resource_hub, level: :essential) do
    %{
      id: OperatelyWeb.Paths.resource_hub_id(resource_hub),
      name: resource_hub.name,
      description: Jason.encode!(resource_hub.description),
      space: OperatelyWeb.Api.Serializer.serialize(resource_hub.space),
      nodes: OperatelyWeb.Api.Serializer.serialize(resource_hub.nodes),
      potential_subscribers: OperatelyWeb.Api.Serializer.serialize(resource_hub.potential_subscribers),
      inserted_at: OperatelyWeb.Api.Serializer.serialize(resource_hub.inserted_at),
      updated_at: OperatelyWeb.Api.Serializer.serialize(resource_hub.updated_at),
    }
  end
end

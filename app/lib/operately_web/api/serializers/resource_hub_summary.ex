defimpl OperatelyWeb.Api.Serializable, for: Operately.ResourceHubs.Summary do
  def serialize(hub, level: :essential) do
    %{
      id: OperatelyWeb.Paths.resource_hub_id(hub.id),
      name: hub.name,
      position: hub.position,
      is_default: hub.is_default
    }
  end
end

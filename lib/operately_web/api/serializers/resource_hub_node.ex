defimpl OperatelyWeb.Api.Serializable, for: Operately.ResourceHubs.Node do
  def serialize(node, level: :essential) do
    %{
      id: OperatelyWeb.Paths.node_id(node),
      name: node.name,
      type: node.type,
    }
  end
end

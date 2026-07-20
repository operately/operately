defimpl OperatelyWeb.Api.Serializable, for: Operately.ResourceHubs.Node do
  def serialize(node, level: :essential) do
    %{
      id: OperatelyWeb.Paths.node_id(node),
      name: node_display_name(node),
      type: node.type,
      inserted_at: OperatelyWeb.Api.Serializer.serialize(node.inserted_at),
      updated_at: OperatelyWeb.Api.Serializer.serialize(node.updated_at),
      folder: OperatelyWeb.Api.Serializer.serialize(node.folder),
      document: OperatelyWeb.Api.Serializer.serialize(node.document),
      file: OperatelyWeb.Api.Serializer.serialize(node.file),
      link: OperatelyWeb.Api.Serializer.serialize(node.link),
    }
  end

  defp node_display_name(%{type: :document, document: %{name: name}}), do: name

  defp node_display_name(%{type: :document} = node) do
    raise ArgumentError,
          "expected :document node to have its :document association preloaded, got: #{inspect(node)}"
  end

  defp node_display_name(%{type: :link, link: %{name: name}}), do: name

  defp node_display_name(%{type: :link} = node) do
    raise ArgumentError,
          "expected :link node to have its :link association preloaded, got: #{inspect(node)}"
  end

  defp node_display_name(node), do: node.name
end

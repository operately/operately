defimpl OperatelyWeb.Api.Serializable, for: Operately.ResourceHubs.Document do
  def serialize(document, level: :essential) do
    %{
      id: OperatelyWeb.Paths.document_id(document),
      name: document.node.name,
      content: document.content,
    }
  end

  def serialize(document, level: :full) do
    %{
      id: OperatelyWeb.Paths.document_id(document),
      name: document.node.name,
      content: document.content,
      permissions: OperatelyWeb.Api.Serializer.serialize(document.permissions),
    }
  end
end

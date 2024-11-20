defimpl OperatelyWeb.Api.Serializable, for: Operately.ResourceHubs.Document do
  def serialize(document, level: :essential) do
    %{
      id: OperatelyWeb.Paths.document_id(document),
      name: document.node.name,
      content: Jason.encode!(document.content),
    }
  end

  def serialize(document, level: :full) do
    %{
      id: OperatelyWeb.Paths.document_id(document),
      author: OperatelyWeb.Api.Serializer.serialize(document.author),
      resource_hub: OperatelyWeb.Api.Serializer.serialize(document.node.resource_hub),
      parent_folder: OperatelyWeb.Api.Serializer.serialize(document.node.parent_folder),
      name: document.node.name,
      content: Jason.encode!(document.content),
      inserted_at: OperatelyWeb.Api.Serializer.serialize(document.inserted_at),
      permissions: OperatelyWeb.Api.Serializer.serialize(document.permissions),
    }
  end
end

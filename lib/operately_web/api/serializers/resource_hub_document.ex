defimpl OperatelyWeb.Api.Serializable, for: Operately.ResourceHubs.Document do
  def serialize(document, level: :essential) do
    %{
      id: OperatelyWeb.Paths.document_id(document),
      name: document.node.name,
      author: OperatelyWeb.Api.Serializer.serialize(document.author),
      content: Jason.encode!(document.content),
      resource_hub_id: OperatelyWeb.Paths.resource_hub_id(document.node.resource_hub_id),
      parent_folder_id: document.node.parent_folder_id && OperatelyWeb.Paths.folder_id(document.node.parent_folder_id),
      comments_count: document.comments_count,
    }
  end

  def serialize(document, level: :full) do
    %{
      id: OperatelyWeb.Paths.document_id(document),
      author: OperatelyWeb.Api.Serializer.serialize(document.author),
      resource_hub_id: OperatelyWeb.Paths.resource_hub_id(document.node.resource_hub_id),
      resource_hub: OperatelyWeb.Api.Serializer.serialize(document.node.resource_hub),
      parent_folder_id: document.node.parent_folder_id && OperatelyWeb.Paths.folder_id(document.node.parent_folder_id),
      parent_folder: OperatelyWeb.Api.Serializer.serialize(document.node.parent_folder),
      name: document.node.name,
      content: Jason.encode!(document.content),
      reactions: OperatelyWeb.Api.Serializer.serialize(document.reactions),
      inserted_at: OperatelyWeb.Api.Serializer.serialize(document.inserted_at),
      permissions: OperatelyWeb.Api.Serializer.serialize(document.permissions),
      potential_subscribers: OperatelyWeb.Api.Serializer.serialize(document.potential_subscribers),
      subscription_list: OperatelyWeb.Api.Serializer.serialize(document.subscription_list),
      notifications: OperatelyWeb.Api.Serializer.serialize(document.notifications),
      path_to_document: OperatelyWeb.Api.Serializer.serialize(document.path_to_document),
    }
  end
end

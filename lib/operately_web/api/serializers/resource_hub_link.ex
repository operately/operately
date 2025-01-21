defimpl OperatelyWeb.Api.Serializable, for: Operately.ResourceHubs.Link do
  def serialize(link, level: :essential) do
    %{
      id: OperatelyWeb.Paths.link_id(link),
      name: link.node.name,
      url: link.url,
      description: Jason.encode!(link.description),
      type: Atom.to_string(link.type),
      parent_folder_id: link.node.parent_folder_id && OperatelyWeb.Paths.folder_id(link.node.parent_folder_id),
      author: OperatelyWeb.Api.Serializer.serialize(link.author),
      comments_count: link.comments_count,
    }
  end

  def serialize(link, level: :full) do
    %{
      id: OperatelyWeb.Paths.link_id(link),
      author: OperatelyWeb.Api.Serializer.serialize(link.author),
      resource_hub_id: OperatelyWeb.Paths.resource_hub_id(link.node.resource_hub_id),
      resource_hub: OperatelyWeb.Api.Serializer.serialize(link.node.resource_hub),
      parent_folder: OperatelyWeb.Api.Serializer.serialize(link.node.parent_folder),
      name: link.node.name,
      url: link.url,
      description: Jason.encode!(link.description),
      type: Atom.to_string(link.type),
      reactions: OperatelyWeb.Api.Serializer.serialize(link.reactions),
      inserted_at: OperatelyWeb.Api.Serializer.serialize(link.inserted_at),
      permissions: OperatelyWeb.Api.Serializer.serialize(link.permissions),
      potential_subscribers: OperatelyWeb.Api.Serializer.serialize(link.potential_subscribers),
      subscription_list: OperatelyWeb.Api.Serializer.serialize(link.subscription_list),
      notifications: OperatelyWeb.Api.Serializer.serialize(link.notifications),
      path_to_link: OperatelyWeb.Api.Serializer.serialize(link.path_to_link),
    }
  end
end

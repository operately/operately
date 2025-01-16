defimpl OperatelyWeb.Api.Serializable, for: Operately.ResourceHubs.Folder do
  def serialize(folder, level: :essential) do
    %{
      id: OperatelyWeb.Paths.folder_id(folder),
      name: folder.node.name,
      children_count: folder.children_count,
      resource_hub_id: folder.node.resource_hub_id && OperatelyWeb.Paths.resource_hub_id(folder.node.resource_hub_id),
      parent_folder_id: folder.node.parent_folder_id && OperatelyWeb.Paths.folder_id(folder.node.parent_folder_id),
    }
  end

  def serialize(folder, level: :full) do
    %{
      id: OperatelyWeb.Paths.folder_id(folder),
      resource_hub: OperatelyWeb.Api.Serializer.serialize(folder.node.resource_hub),
      resource_hub_id: OperatelyWeb.Paths.resource_hub_id(folder.node.resource_hub_id),
      name: folder.node.name,
      nodes: OperatelyWeb.Api.Serializer.serialize(folder.child_nodes),
      permissions: OperatelyWeb.Api.Serializer.serialize(folder.permissions),
      path_to_folder: OperatelyWeb.Api.Serializer.serialize(folder.path_to_folder),
      potential_subscribers: OperatelyWeb.Api.Serializer.serialize(folder.potential_subscribers),
    }
  end
end

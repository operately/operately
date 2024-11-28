defimpl OperatelyWeb.Api.Serializable, for: Operately.ResourceHubs.Folder do
  def serialize(folder, level: :essential) do
    %{
      id: OperatelyWeb.Paths.folder_id(folder),
      name: folder.node.name,
      children_count: folder.children_count,
    }
  end

  def serialize(folder, level: :full) do
    %{
      id: OperatelyWeb.Paths.folder_id(folder),
      resource_hub: OperatelyWeb.Api.Serializer.serialize(folder.node.resource_hub),
      name: folder.node.name,
      nodes: OperatelyWeb.Api.Serializer.serialize(folder.child_nodes),
      permissions: OperatelyWeb.Api.Serializer.serialize(folder.permissions),
      path_to_folder: OperatelyWeb.Api.Serializer.serialize(folder.path_to_folder),
    }
  end
end

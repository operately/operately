defimpl OperatelyWeb.Api.Serializable, for: Operately.ResourceHubs.Folder do
  def serialize(folder, level: :essential) do
    %{
      id: OperatelyWeb.Paths.folder_id(folder),
      name: folder.node.name,
      description: folder.description && Jason.encode!(folder.description),
    }
  end

  def serialize(folder, level: :full) do
    %{
      id: OperatelyWeb.Paths.folder_id(folder),
      name: folder.node.name,
      description: folder.description && Jason.encode!(folder.description),
      permissions: OperatelyWeb.Api.Serializer.serialize(folder.permissions),
    }
  end
end

defimpl OperatelyWeb.Api.Serializable, for: Operately.ResourceHubs.File do
  def serialize(file, level: :essential) do
    %{
      id: OperatelyWeb.Paths.file_id(file),
      name: file.node.name,
      description: Jason.encode!(file.description),
      type: Ecto.assoc_loaded?(file.blob) && file.blob.content_type,
      size: Ecto.assoc_loaded?(file.blob) && file.blob.size,
      blob: OperatelyWeb.Api.Serializer.serialize(file.preview_blob || file.blob),
      parent_folder_id: file.node.parent_folder_id && OperatelyWeb.Paths.folder_id(file.node.parent_folder_id),
      comments_count: file.comments_count,
    }
  end

  def serialize(file, level: :full) do
    %{
      id: OperatelyWeb.Paths.file_id(file),
      author: OperatelyWeb.Api.Serializer.serialize(file.author),
      resource_hub_id: file.node.resource_hub_id,
      resource_hub: OperatelyWeb.Api.Serializer.serialize(file.node.resource_hub),
      parent_folder: OperatelyWeb.Api.Serializer.serialize(file.node.parent_folder),
      name: file.node.name,
      description: Jason.encode!(file.description),
      potential_subscribers: OperatelyWeb.Api.Serializer.serialize(file.potential_subscribers),
      subscription_list: OperatelyWeb.Api.Serializer.serialize(file.subscription_list),
      reactions: OperatelyWeb.Api.Serializer.serialize(file.reactions),
      inserted_at: OperatelyWeb.Api.Serializer.serialize(file.inserted_at),
      permissions: OperatelyWeb.Api.Serializer.serialize(file.permissions),
      type: Ecto.assoc_loaded?(file.blob) && file.blob.content_type,
      size: Ecto.assoc_loaded?(file.blob) && file.blob.size,
      blob: OperatelyWeb.Api.Serializer.serialize(file.blob),
      path_to_file: OperatelyWeb.Api.Serializer.serialize(file.path_to_file),
    }
  end
end

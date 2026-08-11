defimpl OperatelyWeb.Api.Serializable, for: Operately.ProjectTemplates.ResourceNode do
  alias OperatelyWeb.Api.Serializer
  alias OperatelyWeb.Paths

  def serialize(node, level: _level) do
    %{
      id: Paths.project_template_resource_node_id(node),
      project_template_id: Paths.project_template_id(node.project_template_id),
      parent_folder_id: node.parent_folder_id && Paths.project_template_resource_folder_id(node.parent_folder_id),
      type: node.type,
      position: node.position,
      folder: Serializer.serialize(node.folder),
      document: Serializer.serialize(node.document),
      file: Serializer.serialize(node.file),
      link: Serializer.serialize(node.link),
      inserted_at: Serializer.serialize(node.inserted_at),
      updated_at: Serializer.serialize(node.updated_at)
    }
  end
end

defimpl OperatelyWeb.Api.Serializable, for: Operately.ProjectTemplates.ResourceFolder do
  alias OperatelyWeb.Paths

  def serialize(folder, level: _level),
    do: %{
      id: Paths.project_template_resource_folder_id(folder),
      node_id: Paths.project_template_resource_node_id(folder.node_id),
      name: folder.name,
      inserted_at: OperatelyWeb.Api.Serializer.serialize(folder.inserted_at),
      updated_at: OperatelyWeb.Api.Serializer.serialize(folder.updated_at)
    }
end

defimpl OperatelyWeb.Api.Serializable, for: Operately.ProjectTemplates.ResourceDocument do
  alias OperatelyWeb.Api.Serializer
  alias OperatelyWeb.Paths

  def serialize(document, level: _level),
    do: %{
      id: Paths.project_template_resource_document_id(document),
      node_id: Paths.project_template_resource_node_id(document.node_id),
      author: Serializer.serialize(document.author),
      name: document.name,
      content: Jason.encode!(document.content),
      inserted_at: Serializer.serialize(document.inserted_at),
      updated_at: Serializer.serialize(document.updated_at)
    }
end

defimpl OperatelyWeb.Api.Serializable, for: Operately.ProjectTemplates.ResourceFile do
  alias OperatelyWeb.Api.Serializer
  alias OperatelyWeb.Paths

  def serialize(file, level: _level),
    do: %{
      id: Paths.project_template_resource_file_id(file),
      node_id: Paths.project_template_resource_node_id(file.node_id),
      author: Serializer.serialize(file.author),
      name: file.name,
      description: file.description && Jason.encode!(file.description),
      blob: Serializer.serialize(file.blob),
      preview_blob: Serializer.serialize(file.preview_blob),
      inserted_at: Serializer.serialize(file.inserted_at),
      updated_at: Serializer.serialize(file.updated_at)
    }
end

defimpl OperatelyWeb.Api.Serializable, for: Operately.ProjectTemplates.ResourceLink do
  alias OperatelyWeb.Api.Serializer
  alias OperatelyWeb.Paths

  def serialize(link, level: _level),
    do: %{
      id: Paths.project_template_resource_link_id(link),
      node_id: Paths.project_template_resource_node_id(link.node_id),
      author: Serializer.serialize(link.author),
      name: link.name,
      url: link.url,
      description: link.description && Jason.encode!(link.description),
      type: link.type,
      inserted_at: Serializer.serialize(link.inserted_at),
      updated_at: Serializer.serialize(link.updated_at)
    }
end

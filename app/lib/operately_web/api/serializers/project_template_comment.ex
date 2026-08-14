defimpl OperatelyWeb.Api.Serializable, for: Operately.ProjectTemplates.Comment do
  alias OperatelyWeb.Api.Serializer
  alias OperatelyWeb.Paths

  def serialize(comment, level: :essential) do
    %{
      id: Paths.project_template_comment_id(comment),
      parent_type: comment.parent_type,
      parent_id: encode_parent_id(comment.parent_type, comment.parent_id),
      content: Jason.encode!(comment.content),
      author: Serializer.serialize(comment.author),
      position: comment.position,
      inserted_at: Serializer.serialize(comment.inserted_at),
      updated_at: Serializer.serialize(comment.updated_at)
    }
  end

  def serialize(comment, level: :full), do: serialize(comment, level: :essential)

  defp encode_parent_id(:discussion, id), do: Paths.project_template_discussion_id(id)
  defp encode_parent_id(:document, id), do: Paths.project_template_resource_document_id(id)
  defp encode_parent_id(:file, id), do: Paths.project_template_resource_file_id(id)
  defp encode_parent_id(:link, id), do: Paths.project_template_resource_link_id(id)
end

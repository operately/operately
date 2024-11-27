defimpl OperatelyWeb.Api.Serializable, for: Operately.ResourceHubs.Permissions do
  def serialize(permissions, level: :essential) do
    %{
      can_comment_on_document: permissions.can_comment_on_document,
      can_create_document: permissions.can_create_document,
      can_create_folder: permissions.can_create_folder,
      can_create_file: permissions.can_create_file,
      can_delete_document: permissions.can_delete_document,
      can_edit_document: permissions.can_edit_document,
      can_view: permissions.can_view,
    }
  end
end

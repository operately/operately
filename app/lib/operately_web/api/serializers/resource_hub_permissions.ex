defimpl OperatelyWeb.Api.Serializable, for: Operately.ResourceHubs.Permissions do
  def serialize(permissions, level: :essential) do
    %{
      can_comment_on_document: permissions.can_comment_on_document,
      can_comment_on_file: permissions.can_comment_on_file,
      can_comment_on_link: permissions.can_comment_on_link,
      can_copy_folder: permissions.can_copy_folder,
      can_create_document: permissions.can_create_document,
      can_create_folder: permissions.can_create_folder,
      can_create_file: permissions.can_create_file,
      can_create_link: permissions.can_create_link,
      can_delete_document: permissions.can_delete_document,
      can_delete_file: permissions.can_delete_file,
      can_delete_folder: permissions.can_delete_folder,
      can_delete_link: permissions.can_delete_link,
      can_edit_document: permissions.can_edit_document,
      can_edit_parent_folder: permissions.can_edit_parent_folder,
      can_edit_file: permissions.can_edit_file,
      can_edit_link: permissions.can_edit_link,
      can_rename_folder: permissions.can_rename_folder,
      can_view: permissions.can_view,
    }
  end
end

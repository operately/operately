defimpl OperatelyWeb.Api.Serializable, for: Operately.Goals.Permissions do
  def serialize(permissions, level: :full) do
    %{
      can_view: permissions.can_view,
      can_edit: permissions.can_edit,
      can_edit_target: permissions.can_edit_target,
      can_edit_checklist: permissions.can_edit_checklist,
      can_check_in: permissions.can_check_in,
      can_close: permissions.can_close,
      can_archive: permissions.can_archive,
      can_reopen: permissions.can_reopen,
      can_delete: permissions.can_delete,
      can_open_discussion: permissions.can_open_discussion,
      can_edit_discussion: permissions.can_edit_discussion,
      can_edit_access_level: permissions.can_edit_access_level,
    }
  end
end

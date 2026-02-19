defimpl OperatelyWeb.Api.Serializable, for: Operately.Projects.Permissions do
  def serialize(permissions, level: :essential) do
    %{
      can_view: permissions.can_view,
      can_comment_on_milestone: permissions.can_comment_on_milestone,
      can_comment_on_task: permissions.can_comment_on_task,
      can_create_milestone: permissions.can_create_milestone,
      can_create_task: permissions.can_create_task,
      can_create_discussion: permissions.can_create_discussion,
      can_complete_milestone: permissions.can_complete_milestone,
      can_reopen_milestone: permissions.can_reopen_milestone,
      can_delete_milestone: permissions.can_delete_milestone,
      can_edit: permissions.can_edit,
      can_edit_space: permissions.can_edit_space,
      can_edit_permissions: permissions.can_edit_permissions,
      can_comment_on_check_in: permissions.can_comment_on_check_in,
      can_close: permissions.can_close,
      can_pause: permissions.can_pause,
      can_resume: permissions.can_resume,
      can_check_in: permissions.can_check_in,
      can_acknowledge_check_in: permissions.can_acknowledge_check_in,
      can_comment_on_retrospective: permissions.can_comment_on_retrospective,
      can_comment: permissions.can_comment,
      can_delete: permissions.can_delete,
      has_full_access: permissions.has_full_access
    }
  end
end

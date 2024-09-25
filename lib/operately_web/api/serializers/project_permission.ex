defimpl OperatelyWeb.Api.Serializable, for: Operately.Projects.Permissions do
  def serialize(permissions, level: :essential) do
    %{
      can_view: permissions.can_view,
      can_comment_on_milestone: permissions.can_comment_on_milestone,
      can_complete_milestone: permissions.can_complete_milestone,
      can_reopen_milestone: permissions.can_reopen_milestone,
      can_create_milestone: permissions.can_create_milestone,
      can_delete_milestone: permissions.can_delete_milestone,
      can_edit_milestone: permissions.can_edit_milestone,
      can_comment_on_check_in: permissions.can_comment_on_check_in,
      can_edit_check_in: permissions.can_edit_check_in,
      can_edit_description: permissions.can_edit_description,
      can_edit_timeline: permissions.can_edit_timeline,
      can_edit_resources: permissions.can_edit_resources,
      can_edit_goal: permissions.can_edit_goal,
      can_edit_name: permissions.can_edit_name,
      can_edit_space: permissions.can_edit_space,
      can_edit_retrospective: permissions.can_edit_retrospective,
      can_edit_contributors: permissions.can_edit_contributors,
      can_edit_permissions: permissions.can_edit_permissions,
      can_edit_task: permissions.can_edit_task,
      can_close: permissions.can_close,
      can_pause: permissions.can_pause,
      can_check_in: permissions.can_check_in,
      can_acknowledge_check_in: permissions.can_acknowledge_check_in,
    }
  end
end

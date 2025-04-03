defimpl OperatelyWeb.Api.Serializable, for: Operately.Groups.Permissions do
  def serialize(permissions, level: :essential) do
    %{
      can_create_goal: permissions.can_create_goal,
      can_create_project: permissions.can_create_project,
      can_comment_on_discussions: permissions.can_comment_on_discussions,
      can_edit: permissions.can_edit,
      can_edit_discussions: permissions.can_edit_discussions,
      can_edit_members_permissions: permissions.can_edit_members_permissions,
      can_edit_permissions: permissions.can_edit_permissions,
      can_join: permissions.can_join,
      can_post_discussions: permissions.can_post_discussions,
      can_remove_member: permissions.can_remove_member,
      can_view: permissions.can_view,
      can_view_message: permissions.can_view_message,
      can_add_members: permissions.can_add_members,
    }
  end
end

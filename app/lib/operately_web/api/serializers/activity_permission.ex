defimpl OperatelyWeb.Api.Serializable, for: Operately.Activities.Permissions do
  def serialize(permissions, level: :full) do
    %{
      can_comment_on_thread: permissions.can_comment_on_thread,
      can_view: permissions.can_view,
      can_acknowledge: permissions.can_acknowledge,
    }
  end
end

defimpl OperatelyWeb.Api.Serializable, for: Operately.Goals.Permissions do
  def serialize(permissions, level: :full) do
    %{
      can_view: permissions.can_view,
      can_comment: permissions.can_comment,
      can_edit: permissions.can_edit,
      has_full_access: permissions.has_full_access,
    }
  end
end

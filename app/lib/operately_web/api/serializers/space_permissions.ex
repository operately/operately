defimpl OperatelyWeb.Api.Serializable, for: Operately.Groups.Permissions do
  def serialize(permissions, level: :essential) do
    %{
      can_view: permissions.can_view,
      can_edit: permissions.can_edit,
      can_comment: permissions.can_comment,
      has_full_access: permissions.has_full_access,
    }
  end
end

defimpl OperatelyWeb.Api.Serializable, for: Operately.Goals.Update.Permissions do
  def serialize(permissions, level: :essential) do
    serialize(permissions, level: :full)
  end

  def serialize(permissions, level: :full) do
    %{
      can_view: permissions.can_view,
      can_edit: permissions.can_edit,
      can_delete: permissions.can_delete,
      can_acknowledge: permissions.can_acknowledge,
      can_comment: permissions.can_comment
    }
  end
end

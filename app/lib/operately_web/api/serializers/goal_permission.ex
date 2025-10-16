defimpl OperatelyWeb.Api.Serializable, for: Operately.Goals.Permissions do
  def serialize(permissions, level: :full) do
    %{
      can_edit: permissions.can_edit,
      can_check_in: permissions.can_check_in,
      can_close: permissions.can_close,
      can_archive: permissions.can_archive,
      can_delete: permissions.can_delete
    }
  end
end

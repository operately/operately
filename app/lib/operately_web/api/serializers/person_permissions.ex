defimpl OperatelyWeb.Api.Serializable, for: Operately.People.Permissions do
  def serialize(permissions, level: :essential) do
    %{
      can_edit_profile: permissions.can_edit_profile
    }
  end
end

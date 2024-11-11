defimpl OperatelyWeb.Api.Serializable, for: Operately.ResourceHubs.Permissions do
  def serialize(permissions, level: :essential) do
    %{
      can_create_folder: permissions.can_create_folder,
    }
  end
end

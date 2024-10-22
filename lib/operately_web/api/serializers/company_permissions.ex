defimpl OperatelyWeb.Api.Serializable, for: Operately.Companies.Permissions do
  def serialize(permissions, level: :essential) do
    Map.from_struct(permissions)
  end
end

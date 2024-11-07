defimpl OperatelyWeb.Api.Serializable, for: Operately.Groups.Group do
  def serialize(space, level: :essential) do
    %{
      id: OperatelyWeb.Paths.space_id(space),
      name: space.name,
    }
  end

  def serialize(space, level: :full) do
    serialize(space, level: :essential) |> Map.merge(%{
      id: OperatelyWeb.Paths.space_id(space),
      name: space.name,
      mission: space.mission,
      is_member: space.is_member,
      is_company_space: space.company.company_space_id == space.id,
      permissions: OperatelyWeb.Api.Serializer.serialize(space.permissions),
      members: OperatelyWeb.Api.Serializer.serialize(space.members),
      access_levels: OperatelyWeb.Api.Serializer.serialize(space.access_levels, level: :full),
      potential_subscribers: OperatelyWeb.Api.Serializer.serialize(space.potential_subscribers),
      notifications: OperatelyWeb.Api.Serializer.serialize(space.notifications),
    })
  end
end

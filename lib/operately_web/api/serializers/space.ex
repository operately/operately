defimpl OperatelyWeb.Api.Serializable, for: Operately.Groups.Group do
  def serialize(space, level: :essential) do
    %{
      id: OperatelyWeb.Paths.space_id(space),
      name: space.name,
      color: space.color,
      icon: space.icon,
    }
  end

  def serialize(space, level: :full) do
    %{
      id: OperatelyWeb.Paths.space_id(space),
      name: space.name,
      mission: space.mission,
      color: space.color,
      icon: space.icon,
      is_member: space.is_member,
      is_company_space: space.company.company_space_id == space.id,
      members: OperatelyWeb.Api.Serializer.serialize(space.members),
      access_levels: OperatelyWeb.Api.Serializer.serialize(space.access_levels, level: :full),
      potential_subscribers: OperatelyWeb.Api.Serializer.serialize(space.potential_subscribers),
    }
  end
end

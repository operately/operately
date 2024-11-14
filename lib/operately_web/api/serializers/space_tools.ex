defimpl OperatelyWeb.Api.Serializable, for: Operately.Groups.SpaceTools do
  def serialize(space_tools, level: :essential) do
    %{
      projects: OperatelyWeb.Api.Serializer.serialize(space_tools.projects),
      goals: OperatelyWeb.Api.Serializer.serialize(space_tools.goals),
      messages_boards: OperatelyWeb.Api.Serializer.serialize(space_tools.messages_boards),
      resource_hubs: OperatelyWeb.Api.Serializer.serialize(space_tools.resource_hubs),
    }
  end
end

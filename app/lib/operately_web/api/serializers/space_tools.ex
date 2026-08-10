defimpl OperatelyWeb.Api.Serializable, for: Operately.Groups.SpaceTools do
  def serialize(space_tools, level: :essential) do
    %{
      tasks_enabled: space_tools.tasks_enabled,
      discussions_enabled: space_tools.discussions_enabled,
      resource_hub_enabled: space_tools.resource_hub_enabled,
      kpis_enabled: space_tools.kpis_enabled,
      templates_enabled: space_tools.templates_enabled,
      projects: OperatelyWeb.Api.Serializer.serialize(space_tools.projects, level: :full),
      goals: OperatelyWeb.Api.Serializer.serialize(space_tools.goals, level: :full),
      messages_boards: OperatelyWeb.Api.Serializer.serialize(space_tools.messages_boards),
      resource_hubs: OperatelyWeb.Api.Serializer.serialize(space_tools.resource_hubs),
      tasks: OperatelyWeb.Api.Serializer.serialize(space_tools.tasks, level: :full),
      kpis: OperatelyWeb.Api.Serializer.serialize(space_tools.kpis, level: :full),
      templates: OperatelyWeb.Api.Serializer.serialize(space_tools.templates, level: :essential)
    }
  end
end

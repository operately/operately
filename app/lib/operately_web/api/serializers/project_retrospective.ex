defimpl OperatelyWeb.Api.Serializable, for: Operately.Projects.Retrospective do
  def serialize(retrospective, level: :essential) do
    %{
      id: OperatelyWeb.Paths.project_retrospective_id(retrospective),
      author: OperatelyWeb.Api.Serializer.serialize(retrospective.author),
      project: OperatelyWeb.Api.Serializer.serialize(retrospective.project),
      champion: serialize_project_person(retrospective.project, :champion),
      reviewer: serialize_project_person(retrospective.project, :reviewer),
      content: Jason.encode!(retrospective.content),
      closed_at: Ecto.assoc_loaded?(retrospective.project) && OperatelyWeb.Api.Serializer.serialize(retrospective.project.closed_at),
      permissions: OperatelyWeb.Api.Serializer.serialize(retrospective.permissions),
      reactions: OperatelyWeb.Api.Serializer.serialize(retrospective.reactions),
      subscription_list: OperatelyWeb.Api.Serializer.serialize(retrospective.subscription_list),
      potential_subscribers: OperatelyWeb.Api.Serializer.serialize(retrospective.potential_subscribers),
      notifications: OperatelyWeb.Api.Serializer.serialize(retrospective.notifications),
      acknowledged_at: OperatelyWeb.Api.Serializer.serialize(retrospective.acknowledged_at),
      acknowledged_by: OperatelyWeb.Api.Serializer.serialize(retrospective.acknowledged_by),
    }
  end

  defp serialize_project_person(%Ecto.Association.NotLoaded{}, _field), do: nil
  defp serialize_project_person(nil, _field), do: nil

  defp serialize_project_person(project, field) do
    OperatelyWeb.Api.Serializer.serialize(Map.get(project, field))
  end
end

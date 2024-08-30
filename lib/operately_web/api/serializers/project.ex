defimpl OperatelyWeb.Api.Serializable, for: Operately.Projects.Project do
  def serialize(project, level: :essential) do
    %{
      id: OperatelyWeb.Paths.project_id(project),
      name: project.name,
      private: project.private,
      status: project.status,
    }
  end

  def serialize(project, level: :full) do
    %{
      id: OperatelyWeb.Paths.project_id(project),
      name: project.name,
      private: project.private,
      status: project.status,
      next_check_in_scheduled_at: OperatelyWeb.Api.Serializer.serialize(project.next_check_in_scheduled_at),
      description: project.description && Jason.encode!(project.description),
      retrospective: project.retrospective && Jason.encode!(project.retrospective),
      inserted_at: OperatelyWeb.Api.Serializer.serialize(project.inserted_at),
      updated_at: OperatelyWeb.Api.Serializer.serialize(project.updated_at),
      started_at: OperatelyWeb.Api.Serializer.serialize(project.started_at),
      closed_at: OperatelyWeb.Api.Serializer.serialize(project.closed_at),
      deadline: OperatelyWeb.Api.Serializer.serialize(project.deadline),
      is_archived: project.deleted_at != nil,
      is_outdated: Operately.Projects.outdated?(project),
      closed_by: OperatelyWeb.Api.Serializer.serialize(project.closed_by),
      space: OperatelyWeb.Api.Serializer.serialize(project.group),
      champion: OperatelyWeb.Api.Serializer.serialize(project.champion),
      reviewer: OperatelyWeb.Api.Serializer.serialize(project.reviewer),
      goal: OperatelyWeb.Api.Serializer.serialize(project.goal),
      milestones: OperatelyWeb.Api.Serializer.serialize(project.milestones),
      contributors: OperatelyWeb.Api.Serializer.serialize(exclude_suspended(project)),
      last_check_in: OperatelyWeb.Api.Serializer.serialize(project.last_check_in),
      next_milestone: OperatelyWeb.Api.Serializer.serialize(project.next_milestone),
      permissions: OperatelyWeb.Api.Serializer.serialize(project.permissions),
      key_resources: OperatelyWeb.Api.Serializer.serialize(project.key_resources),
      access_levels: OperatelyWeb.Api.Serializer.serialize(project.access_levels, level: :full),
    }
  end

  defp exclude_suspended(project) do
    case project.contributors do
      %Ecto.Association.NotLoaded{} -> []
      contributors -> Enum.filter(contributors, &(not is_nil(&1.person)))
    end
  end
end

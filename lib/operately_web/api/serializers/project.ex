defimpl OperatelyWeb.Api.Serializable, for: Operately.Projects.Project do
  def serialize(project, level: :essential) do
    %{
      id: OperatelyWeb.Paths.project_id(project),
      name: project.name,
      privacy: OperatelyWeb.Api.Serializer.serialize(project.privacy),
      status: project.status,
      goal_id: project.goal_id && OperatelyWeb.Paths.goal_id(project.goal_id),
    }
  end

  def serialize(project, level: :full) do
    serialize(project, level: :essential) 
    |> Map.merge(%{
      next_check_in_scheduled_at: OperatelyWeb.Api.Serializer.serialize(project.next_check_in_scheduled_at),
      description: project.description && Jason.encode!(project.description),
      retrospective: OperatelyWeb.Api.Serializer.serialize(project.retrospective),
      inserted_at: OperatelyWeb.Api.Serializer.serialize(project.inserted_at),
      updated_at: OperatelyWeb.Api.Serializer.serialize(project.updated_at),
      started_at: OperatelyWeb.Api.Serializer.serialize(project.started_at),
      closed_at: OperatelyWeb.Api.Serializer.serialize(project.closed_at),
      deadline: OperatelyWeb.Api.Serializer.serialize(project.deadline),
      is_archived: project.deleted_at != nil,
      is_outdated: Operately.Projects.outdated?(project),
      space: OperatelyWeb.Api.Serializer.serialize(project.group),
      champion: OperatelyWeb.Api.Serializer.serialize(project.champion),
      reviewer: OperatelyWeb.Api.Serializer.serialize(project.reviewer),
      goal: OperatelyWeb.Api.Serializer.serialize(project.goal),
      milestones: OperatelyWeb.Api.Serializer.serialize(project.milestones),
      contributors: OperatelyWeb.Api.Serializer.serialize(sort_contribs(exclude_suspended(project))),
      last_check_in: OperatelyWeb.Api.Serializer.serialize(project.last_check_in),
      next_milestone: OperatelyWeb.Api.Serializer.serialize(project.next_milestone),
      permissions: OperatelyWeb.Api.Serializer.serialize(project.permissions),
      key_resources: OperatelyWeb.Api.Serializer.serialize(project.key_resources),
      access_levels: OperatelyWeb.Api.Serializer.serialize(project.access_levels, level: :full),
      potential_subscribers: OperatelyWeb.Api.Serializer.serialize(project.potential_subscribers),
      notifications: OperatelyWeb.Api.Serializer.serialize(project.notifications),
    })
  end

  defp exclude_suspended(project) do
    case project.contributors do
      %Ecto.Association.NotLoaded{} -> []
      contributors -> Enum.filter(contributors, &(not is_nil(&1.person)))
    end
  end

  @roles_ordering [champion: 0, reviewer: 1, contributor: 2]

  defp sort_contribs(contribs) do
    Enum.sort(contribs, fn contrib1, contrib2 ->
      order1 = Keyword.get(@roles_ordering, contrib1.role, 100)
      order2 = Keyword.get(@roles_ordering, contrib2.role, 100)

      if order1 == order2 do
        contrib1.person.full_name < contrib2.person.full_name
      else
        order1 < order2
      end
    end)
  end
end

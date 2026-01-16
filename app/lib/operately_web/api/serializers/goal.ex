defimpl OperatelyWeb.Api.Serializable, for: Operately.Goals.Goal do
  alias Operately.Goals.Goal

  def serialize(goal, level: :essential) do
    %{
      id: OperatelyWeb.Paths.goal_id(goal),
      name: goal.name,
      permissions: OperatelyWeb.Api.Serializer.serialize(goal.permissions, level: :full),
      targets: OperatelyWeb.Api.Serializer.serialize(goal.targets),
      space: serialize_space(goal.group),
      champion: OperatelyWeb.Api.Serializer.serialize(goal.champion),
      reviewer: OperatelyWeb.Api.Serializer.serialize(goal.reviewer),
      timeframe: OperatelyWeb.Api.Serializer.serialize(goal.timeframe),
      success: goal.success == "yes",
      status: Goal.status(goal) |> Atom.to_string(),
      last_check_in_id: goal.last_check_in_id && OperatelyWeb.Paths.goal_update_id(goal.last_check_in_id),
      is_archived: goal.deleted_at != nil,
      is_closed: goal.closed_at != nil,
      is_outdated: Operately.Goals.outdated?(goal),
      closed_by: OperatelyWeb.Api.Serializer.serialize(goal.closed_by),
      closed_at: OperatelyWeb.Api.Serializer.serialize(goal.closed_at),
      inserted_at: OperatelyWeb.Api.Serializer.serialize(goal.inserted_at),
      updated_at: OperatelyWeb.Api.Serializer.serialize(goal.updated_at),
      archived_at: OperatelyWeb.Api.Serializer.serialize(goal.deleted_at)
    }
  end

  def serialize(goal, level: :full) do
    serialize(goal, level: :essential)
    |> Map.merge(%{
      description: goal.description && Jason.encode!(goal.description),
      parent_goal_id: goal.parent_goal && OperatelyWeb.Paths.goal_id(goal.parent_goal),
      parent_goal: OperatelyWeb.Api.Serializer.serialize(goal.parent_goal),
      progress_percentage: Operately.Goals.Goal.progress_percentage(goal),
      projects: OperatelyWeb.Api.Serializer.serialize(goal.projects, level: :full),
      last_check_in: OperatelyWeb.Api.Serializer.serialize(goal.last_update, level: :full),
      access_levels: OperatelyWeb.Api.Serializer.serialize(goal.access_levels, level: :full),
      privacy: OperatelyWeb.Api.Serializer.serialize(goal.privacy),
      potential_subscribers: OperatelyWeb.Api.Serializer.serialize(goal.potential_subscribers),
      notifications: OperatelyWeb.Api.Serializer.serialize(goal.notifications),
      next_update_scheduled_at: OperatelyWeb.Api.Serializer.serialize(goal.next_update_scheduled_at),
      retrospective: OperatelyWeb.Api.Serializer.serialize(goal.retrospective, level: :essential),
      checklist: OperatelyWeb.Api.Serializer.serialize(goal.checks, level: :essential)
    })
  end

  defp serialize_space(nil), do: nil

  defp serialize_space(space) do
    if Ecto.assoc_loaded?(space) and Ecto.assoc_loaded?(space.members) and Ecto.assoc_loaded?(space.company) do
      OperatelyWeb.Api.Serializer.serialize(space, level: :full)
    else
      OperatelyWeb.Api.Serializer.serialize(space)
    end
  end
end

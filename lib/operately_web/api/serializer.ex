defmodule OperatelyWeb.Api.Serializer do
  @valid_levels [:essential, :full]

  def serialize(data) do
    OperatelyWeb.Api.Serializable.serialize(data, level: :essential)
  end

  def serialize(data, level: level) do
    validate_level(level)
    OperatelyWeb.Api.Serializable.serialize(data, level: level)
  end

  defp validate_level(level) do
    if !Enum.member?(@valid_levels, level) do
      raise ArgumentError, "Invalid level: #{inspect(level)}"
    end
  end
end

defprotocol OperatelyWeb.Api.Serializable do
  @fallback_to_any true

  def serialize(data, opts)
end

defimpl OperatelyWeb.Api.Serializable, for: Any do
  def serialize(nil, _opts), do: nil
  def serialize(%Ecto.Association.NotLoaded{}, _opts), do: nil
  def serialize(datetime = %NaiveDateTime{}, _opts), do: datetime |> NaiveDateTime.to_iso8601()
  def serialize(datetime = %DateTime{}, _opts), do: datetime |> DateTime.to_iso8601()
  def serialize(date = %Date{}, _opts), do: date |> Date.to_iso8601()
end

defimpl OperatelyWeb.Api.Serializable, for: List do
  def serialize(data, opts), do: Enum.map(data, fn item -> OperatelyWeb.Api.Serializer.serialize(item, opts) end)
end

defimpl OperatelyWeb.Api.Serializable, for: Operately.People.Person do
  def serialize(data, level: :essential) do
    %{
      id: data.id,
      full_name: data.full_name,
      avatar_url: data.avatar_url,
      title: data.title,
    }
  end
end

defimpl OperatelyWeb.Api.Serializable, for: Operately.Goals.Target do
  def serialize(target, level: :essential) do
    %{
      id: target.id,
      name: target.name,
      from: target.from,
      to: target.to,
      unit: target.unit,
      index: target.index,
      value: target.value,
      inserted_at: OperatelyWeb.Api.Serializer.serialize(target.inserted_at),
      updated_at: OperatelyWeb.Api.Serializer.serialize(target.updated_at),
    }
  end
end

defimpl OperatelyWeb.Api.Serializable, for: Operately.Goals.Timeframe do
  def serialize(timeframe, level: :essential) do
    %{
      type: timeframe.type,
      start_date: OperatelyWeb.Api.Serializer.serialize(timeframe.start_date),
      end_date: OperatelyWeb.Api.Serializer.serialize(timeframe.end_date),
    }
  end
end

defimpl OperatelyWeb.Api.Serializable, for: Operately.Updates.Reaction do
  def serialize(reaction, level: :essential) do
    %{
      id: reaction.id,
      emoji: reaction.emoji,
      person: OperatelyWeb.Api.Serializer.serialize(reaction.person),
    }
  end
end

defimpl OperatelyWeb.Api.Serializable, for: Operately.Updates.Update do
  def serialize(update = %{type: :goal_check_in}, level: :full) do
    %{
      id: update.id,
      inserted_at: OperatelyWeb.Api.Serializer.serialize(update.inserted_at),
      author: OperatelyWeb.Api.Serializer.serialize(update.author),
      content: %{
        message: Jason.encode!(update.content["message"]),
      },
      reactions: OperatelyWeb.Api.Serializer.serialize(update.reactions),
      comments_count: Operately.Updates.count_comments(update.id, :update)
    }
  end

  def serialize(%{type: :project_discussion}, level: :essential) do
    raise "Not implemented"
  end
end

defimpl OperatelyWeb.Api.Serializable, for: Operately.Goals.Goal do
  def serialize(data, level: :essential) do
    %{
      id: data.id,
      name: data.name,
    }
  end

  def serialize(data, level: :full) do
    %{
      id: data.id,
      name: data.name,
      description: data.description && Jason.encode!(data.description),
      inserted_at: OperatelyWeb.Api.Serializer.serialize(data.inserted_at),
      updated_at: OperatelyWeb.Api.Serializer.serialize(data.updated_at),
      closed_by: OperatelyWeb.Api.Serializer.serialize(data.closed_by),
      closed_at: OperatelyWeb.Api.Serializer.serialize(data.closed_at),

      is_archived: data.deleted_at != nil,
      is_closed: data.closed_at != nil,

      parent_goal_id: data.parent_goal_id,
      parent_goal: OperatelyWeb.Api.Serializer.serialize(data.parent_goal),
      progress_percentage: Operately.Goals.progress_percentage(data),

      timeframe: OperatelyWeb.Api.Serializer.serialize(data.timeframe),
      space: OperatelyWeb.Api.Serializer.serialize(data.group),
      champion: OperatelyWeb.Api.Serializer.serialize(data.champion),
      reviewer: OperatelyWeb.Api.Serializer.serialize(data.reviewer),
      projects: OperatelyWeb.Api.Serializer.serialize(data.projects, level: :full),
      last_check_in: OperatelyWeb.Api.Serializer.serialize(data.last_check_in, level: :full),
      targets: OperatelyWeb.Api.Serializer.serialize(data.targets),
      permissions: OperatelyWeb.Api.Serializer.serialize(data.permissions, level: :full),
    }
  end
end

defimpl OperatelyWeb.Api.Serializable, for: Operately.Groups.Group do
  def serialize(space, level: :essential) do
    %{
      id: space.id,
      name: space.name,
      color: space.color,
      icon: space.icon,
    }
  end
end

defimpl OperatelyWeb.Api.Serializable, for: Operately.Projects.Milestone do
  def serialize(milestone, level: :essential) do
    %{
      id: milestone.id,
      title: milestone.title,
      status: milestone.status,
      description: milestone.description && Jason.encode!(milestone.description),
      inserted_at: OperatelyWeb.Api.Serializer.serialize(milestone.inserted_at),
      deadline_at: OperatelyWeb.Api.Serializer.serialize(milestone.deadline_at),
      completed_at: OperatelyWeb.Api.Serializer.serialize(milestone.completed_at),
    }
  end
end

defimpl OperatelyWeb.Api.Serializable, for: Operately.Projects.KeyResource do
  def serialize(key_resource, level: :essential) do
    %{
      id: key_resource.id,
      title: key_resource.title,
      link: key_resource.link,
      resource_type: key_resource.resource_type,
      inserted_at: OperatelyWeb.Api.Serializer.serialize(key_resource.inserted_at),
    }
  end
end

defimpl OperatelyWeb.Api.Serializable, for: Operately.Projects.Contributor do
  def serialize(contributor, level: :essential) do
    %{
      id: contributor.id,
      role: Atom.to_string(contributor.role),
      responsibility: contributor.responsibility,
      person: OperatelyWeb.Api.Serializer.serialize(contributor.person),
    }
  end
end

defimpl OperatelyWeb.Api.Serializable, for: Operately.Projects.CheckIn do
  def serialize(check_in, level: :essential) do
    %{
      id: check_in.id,
      status: check_in.status,
      description: check_in.description,
      inserted_at: check_in.inserted_at,
      author: OperatelyWeb.Api.Serializer.serialize(check_in.author),
    }
  end
end

defimpl OperatelyWeb.Api.Serializable, for: Operately.Projects.Project do
  def serialize(project, level: :essential) do
    %{
      id: project.id,
      name: project.name,
      private: project.private,
      status: project.status,
    }
  end

  def serialize(project, level: :full) do
    %{
      id: project.id,
      name: project.name,
      private: project.private,
      status: project.status,
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
      contributors: OperatelyWeb.Api.Serializer.serialize(project.contributors),
      last_check_in: OperatelyWeb.Api.Serializer.serialize(project.last_check_in),
      next_milestone: OperatelyWeb.Api.Serializer.serialize(project.next_milestone),
      permissions: OperatelyWeb.Api.Serializer.serialize(project.permissions),
      key_resources: OperatelyWeb.Api.Serializer.serialize(project.key_resources)
    }
  end
end

defimpl OperatelyWeb.Api.Serializable, for: Operately.Projects.Permissions do
  def serialize(permissions, level: :essential) do
    %{
      can_view: permissions.can_view,
      can_create_milestone: permissions.can_create_milestone,
      can_delete_milestone: permissions.can_delete_milestone,
      can_edit_milestone: permissions.can_edit_milestone,
      can_edit_description: permissions.can_edit_description,
      can_edit_timeline: permissions.can_edit_timeline,
      can_edit_resources: permissions.can_edit_resources,
      can_edit_goal: permissions.can_edit_goal,
      can_edit_name: permissions.can_edit_name,
      can_edit_space: permissions.can_edit_space,
      can_edit_contributors: permissions.can_edit_contributors,
      can_pause: permissions.can_pause,
      can_check_in: permissions.can_check_in,
      can_acknowledge_check_in: permissions.can_acknowledge_check_in,
    }
  end
end

defimpl OperatelyWeb.Api.Serializable, for: Operately.Goals.Permissions do
  def serialize(permissions, level: :full) do
    %{
      can_edit: permissions.can_edit,
      can_check_in: permissions.can_check_in,
      can_acknowledge_check_in: permissions.can_acknowledge_check_in,
      can_close: permissions.can_close,
      can_archive: permissions.can_archive,
    }
  end
end

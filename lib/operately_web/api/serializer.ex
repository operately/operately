defprotocol OperatelyWeb.Api.Serializer do
  @fallback_to_any true

  def serialize(data)
end

defimpl OperatelyWeb.Api.Serializer, for: Any do
  def serialize(nil), do: nil
  def serialize(%Ecto.Association.NotLoaded{}), do: nil
  def serialize(datetime = %NaiveDateTime{}), do: datetime |> NaiveDateTime.to_iso8601()
  def serialize(datetime = %DateTime{}), do: datetime |> DateTime.to_iso8601()
end

defimpl OperatelyWeb.Api.Serializer, for: List do
  def serialize(nil), do: nil
  def serialize(data), do: Enum.map(data, &OperatelyWeb.Api.Serializer.serialize/1)
end

defimpl OperatelyWeb.Api.Serializer, for: Operately.People.Person do
  def serialize(data) do
    %{
      id: data.id,
      full_name: data.full_name,
      avatar_url: data.avatar_url,
      title: data.title,
    }
  end
end

defimpl OperatelyWeb.Api.Serializer, for: Operately.Goals.Goal do
  def serialize(data) do
    %{
      id: data.id,
      name: data.name,
    }
  end
end

defimpl OperatelyWeb.Api.Serializer, for: Operately.Groups.Group do
  def serialize(space) do
    %{
      id: space.id,
      name: space.name,
    }
  end
end

defimpl OperatelyWeb.Api.Serializer, for: Operately.Projects.Milestone do
  def serialize(milestone) do
    %{
      id: milestone.id,
      title: milestone.title,
      status: milestone.status,
      inserted_at: OperatelyWeb.Api.Serializer.serialize(milestone.inserted_at),
      deadline_at: OperatelyWeb.Api.Serializer.serialize(milestone.deadline_at),
    }
  end
end

defimpl OperatelyWeb.Api.Serializer, for: Operately.Projects.Contributor do
  def serialize(contributors) do
    Enum.map(contributors, fn contributor ->
      %{
        id: contributor.id,
        role: contributor.role,
        responsibility: contributor.responsibility,
        person: OperatelyWeb.Api.Serializer.serialize(contributor.person),
      }
    end)
  end
end

defimpl OperatelyWeb.Api.Serializer, for: Operately.Projects.CheckIn do
  def serialize(check_in) do
    %{
      id: check_in.id,
      status: check_in.status,
      description: check_in.description,
      inserted_at: check_in.inserted_at,
      author: OperatelyWeb.Api.Serializer.serialize(check_in.author),
    }
  end
end

defimpl OperatelyWeb.Api.Serializer, for: Operately.Projects.Project do
  def serialize(project) do
    %{
      id: project.id,
      name: project.name,
      private: project.private,
      inserted_at: OperatelyWeb.Api.Serializer.serialize(project.inserted_at),
      updated_at: OperatelyWeb.Api.Serializer.serialize(project.updated_at),
      started_at: OperatelyWeb.Api.Serializer.serialize(project.started_at),
      closed_at: OperatelyWeb.Api.Serializer.serialize(project.closed_at),
      deadline: OperatelyWeb.Api.Serializer.serialize(project.deadline),
      is_archived: project.deleted_at != nil,
      is_outdated: Operately.Projects.outdated?(project),
      status: project.status,
      space: OperatelyWeb.Api.Serializer.serialize(project.group),
      champion: OperatelyWeb.Api.Serializer.serialize(project.champion),
      goal: OperatelyWeb.Api.Serializer.serialize(project.goal),
      milestones: OperatelyWeb.Api.Serializer.serialize(project.milestones),
      contributors: OperatelyWeb.Api.Serializer.serialize(project.contributors),
      last_check_in: OperatelyWeb.Api.Serializer.serialize(project.last_check_in),
      next_milestone: OperatelyWeb.Api.Serializer.serialize(project.next_milestone),
    }
  end
end

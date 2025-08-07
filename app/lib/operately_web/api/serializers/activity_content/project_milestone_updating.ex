defimpl OperatelyWeb.Api.Serializable, for: Operately.Activities.Content.ProjectMilestoneUpdating do
  alias OperatelyWeb.Api.Serializer

  def serialize(content, level: :essential) do
    %{
      company_id: Serializer.serialize(content["company_id"], level: :essential),
      company: Serializer.serialize(content["company"], level: :essential),
      space_id: Serializer.serialize(content["space_id"], level: :essential),
      space: Serializer.serialize(content["space"], level: :essential),
      project_id: Serializer.serialize(content["project_id"], level: :essential),
      project: Serializer.serialize(content["project"], level: :essential),
      milestone_id: Serializer.serialize(content["milestone_id"], level: :essential),
      milestone: Serializer.serialize(content["milestone"], level: :essential),
      old_milestone_name: Serializer.serialize(content["old_milestone_name"], level: :essential),
      new_milestone_name: Serializer.serialize(content["new_milestone_name"], level: :essential),
      old_timeframe: Serializer.serialize(content["old_timeframe"], level: :essential),
      new_timeframe: Serializer.serialize(content["new_timeframe"], level: :essential)
    }
  end
end

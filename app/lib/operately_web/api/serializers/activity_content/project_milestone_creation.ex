defimpl OperatelyWeb.Api.Serializable, for: Operately.Activities.Content.ProjectMilestoneCreation do
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
      milestone_name: Serializer.serialize(content["milestone_name"], level: :essential)
    }
  end
end

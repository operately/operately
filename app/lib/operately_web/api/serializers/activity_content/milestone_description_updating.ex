defimpl OperatelyWeb.Api.Serializable, for: Operately.Activities.Content.MilestoneDescriptionUpdating do
  alias OperatelyWeb.Api.Serializer

  def serialize(content, level: :essential) do
    %{
      project: Serializer.serialize(content.project, level: :essential),
      milestone: Serializer.serialize(content.milestone, level: :essential),
      milestone_name: content.milestone_name,
      has_description: content.has_description
    }
  end
end

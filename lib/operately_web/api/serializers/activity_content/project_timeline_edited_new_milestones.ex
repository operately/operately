defimpl OperatelyWeb.Api.Serializable, for: Operately.Activities.Content.ProjectTimelineEdited.NewMilestones do
  def serialize(milestone, level: :essential) do
    %{
      id: OperatelyWeb.Paths.milestone_id(milestone.milestone_id, milestone.title),
      title: milestone.title,
      deadline_at: OperatelyWeb.Api.Serializer.serialize(milestone.due_date),
    }
  end
end

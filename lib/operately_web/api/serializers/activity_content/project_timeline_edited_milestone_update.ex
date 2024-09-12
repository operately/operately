defimpl OperatelyWeb.Api.Serializable, for: Operately.Activities.Content.ProjectTimelineEdited.MilestoneUpdate do
  def serialize(milestone, level: :essential) do
    %{
      id: OperatelyWeb.Paths.milestone_id(milestone.milestone_id, milestone.new_title),
      title: milestone.new_title,
      deadline_at: OperatelyWeb.Api.Serializer.serialize(milestone.new_due_date),
    }
  end
end

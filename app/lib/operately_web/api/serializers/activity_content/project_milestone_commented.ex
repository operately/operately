defimpl OperatelyWeb.Api.Serializable, for: Operately.Activities.Content.ProjectMilestoneCommented do
  def serialize(content, level: :essential) do
    %{
      comment: OperatelyWeb.Api.Serializer.serialize(content.comment),
      comment_action: content.comment_action,
      milestone: %{
        id: OperatelyWeb.Paths.milestone_id(content.milestone),
        title: content.milestone.title,
      },
      project: OperatelyWeb.Api.Serializer.serialize(content.project),
      project_id: OperatelyWeb.Paths.project_id(content.project),
    }
  end
end

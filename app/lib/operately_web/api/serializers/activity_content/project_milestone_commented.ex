defimpl OperatelyWeb.Api.Serializable, for: Operately.Activities.Content.ProjectMilestoneCommented do
  def serialize(content, level: :essential) do
    %{
      comment_action: content.comment_action,
      comment: OperatelyWeb.Api.Serializer.serialize(content.comment),
      milestone: OperatelyWeb.Api.Serializer.serialize(content.milestone),
      project: OperatelyWeb.Api.Serializer.serialize(content.project)
    }
  end
end

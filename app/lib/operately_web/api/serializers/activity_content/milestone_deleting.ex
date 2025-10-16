defimpl OperatelyWeb.Api.Serializable, for: Operately.Activities.Content.MilestoneDeleting do
  alias OperatelyWeb.Api.Serializer

  def serialize(content, level: :essential) do
    %{
      project: Serializer.serialize(content.project, level: :essential),
      milestone_name: content.milestone_name
    }
  end
end

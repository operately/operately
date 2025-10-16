defimpl OperatelyWeb.Api.Serializable, for: Operately.Activities.Content.TaskMilestoneUpdating do
  alias OperatelyWeb.Api.Serializer

  def serialize(content, level: :essential) do
    %{
      project: Serializer.serialize(content["project"], level: :essential),
      task: Serializer.serialize(content["task"], level: :essential),
      old_milestone: Serializer.serialize(content["old_milestone"], level: :essential),
      new_milestone: Serializer.serialize(content["new_milestone"], level: :essential)
    }
  end
end

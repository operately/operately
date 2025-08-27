defimpl OperatelyWeb.Api.Serializable, for: Operately.Activities.Content.MilestoneDueDateUpdating do
  alias OperatelyWeb.Api.Serializer

  def serialize(content, level: :essential) do
    %{
      project: Serializer.serialize(content["project"], level: :essential),
      milestone: Serializer.serialize(content["milestone"], level: :essential),
      milestone_name: content["milestone_name"],
      old_due_date: Serializer.serialize(content["old_due_date"], level: :essential),
      new_due_date: Serializer.serialize(content["new_due_date"], level: :essential),
    }
  end
end

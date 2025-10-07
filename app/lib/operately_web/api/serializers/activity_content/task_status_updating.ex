defimpl OperatelyWeb.Api.Serializable, for: Operately.Activities.Content.TaskStatusUpdating do
  alias OperatelyWeb.Api.Serializer

  def serialize(content, level: :essential) do
    %{
      project: Serializer.serialize(content["project"], level: :essential),
      task: Serializer.serialize(content["task"], level: :essential),
      old_status: Serializer.serialize(content["old_status"], level: :essential),
      new_status: Serializer.serialize(content["new_status"], level: :essential),
      name: Serializer.serialize(content["name"], level: :essential),
    }
  end
end

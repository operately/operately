defimpl OperatelyWeb.Api.Serializable, for: Operately.Activities.Content.TaskNameUpdating do
  alias OperatelyWeb.Api.Serializer

  def serialize(content, level: :essential) do
    %{
      space: Serializer.serialize(content["space"], level: :essential),
      project: Serializer.serialize(content["project"], level: :essential),
      task: Serializer.serialize(content["task"], level: :essential),
      old_name: Serializer.serialize(content["old_name"], level: :essential),
      new_name: Serializer.serialize(content["new_name"], level: :essential),
    }
  end
end

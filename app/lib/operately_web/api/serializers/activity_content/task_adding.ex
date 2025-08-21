defimpl OperatelyWeb.Api.Serializable, for: Operately.Activities.Content.TaskAdding do
  alias OperatelyWeb.Api.Serializer

  def serialize(content, level: :essential) do
    %{
      company: Serializer.serialize(content["company"], level: :essential),
      space: Serializer.serialize(content["space"], level: :essential),
      project: Serializer.serialize(content["project"], level: :essential),
      milestone: Serializer.serialize(content["milestone"], level: :essential),
      task: Serializer.serialize(content["task"], level: :essential),
      task_name: content["name"]
    }
  end
end

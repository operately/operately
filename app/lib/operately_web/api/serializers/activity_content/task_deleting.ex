defimpl OperatelyWeb.Api.Serializable, for: Operately.Activities.Content.TaskDeleting do
  alias OperatelyWeb.Api.Serializer

  def serialize(content, level: :essential) do
    %{
      company: Serializer.serialize(content["company"], level: :essential),
      space: Serializer.serialize(content["space"], level: :essential),
      project: Serializer.serialize(content["project"], level: :essential),
      task_name: Serializer.serialize(content["name"], level: :essential),
    }
  end
end

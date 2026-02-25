defimpl OperatelyWeb.Api.Serializable, for: Operately.Activities.Content.TaskMoving do
  alias OperatelyWeb.Api.Serializer

  def serialize(content, level: :essential) do
    %{
      task: Serializer.serialize(content["task"], level: :essential),
      task_name: content["task_name"],
      origin_type: content["origin_type"],
      destination_type: content["destination_type"],
      origin_project: Serializer.serialize(content["origin_project"], level: :essential),
      origin_space: Serializer.serialize(content["origin_space"], level: :essential),
      destination_project: Serializer.serialize(content["destination_project"], level: :essential),
      destination_space: Serializer.serialize(content["destination_space"], level: :essential)
    }
  end
end

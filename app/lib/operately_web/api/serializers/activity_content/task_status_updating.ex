defimpl OperatelyWeb.Api.Serializable, for: Operately.Activities.Content.TaskStatusUpdating do
  alias OperatelyWeb.Api.Serializer

  def serialize(content, level: :essential) do
    %{
      company_id: Serializer.serialize(content["company_id"], level: :essential),
      company: Serializer.serialize(content["company"], level: :essential),
      space_id: Serializer.serialize(content["space_id"], level: :essential),
      space: Serializer.serialize(content["space"], level: :essential),
      project_id: Serializer.serialize(content["project_id"], level: :essential),
      project: Serializer.serialize(content["project"], level: :essential),
      task_id: Serializer.serialize(content["task_id"], level: :essential),
      old_status: Serializer.serialize(content["old_status"], level: :essential),
      new_status: Serializer.serialize(content["new_status"], level: :essential),
      name: Serializer.serialize(content["name"], level: :essential),
    }
  end
end

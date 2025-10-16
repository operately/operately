defimpl OperatelyWeb.Api.Serializable, for: Operately.Activities.Content.TaskDeleting do
  alias OperatelyWeb.Api.Serializer

  def serialize(content, level: :essential) do
    %{
      company_id: Serializer.serialize(content["company_id"], level: :essential),
      space_id: Serializer.serialize(content["space_id"], level: :essential),
      project_id: Serializer.serialize(content["project_id"], level: :essential),
      task_name: Serializer.serialize(content["name"], level: :essential),
      company: Serializer.serialize(content["company"], level: :essential),
      space: Serializer.serialize(content["space"], level: :essential),
      project: Serializer.serialize(content["project"], level: :essential)
    }
  end
end

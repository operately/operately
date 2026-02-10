defimpl OperatelyWeb.Api.Serializable, for: Operately.Activities.Content.TaskDescriptionChange do
  alias OperatelyWeb.Api.Serializer

  def serialize(content, level: :essential) do
    %{
      task: Serializer.serialize(content["task"], level: :full),
      space: Serializer.serialize(content["space"], level: :essential),
      project_name: Serializer.serialize(content["project_name"], level: :essential),
      has_description: content["has_description"],
      description: Jason.encode!(content["description"]),
    }
  end
end

defimpl OperatelyWeb.Api.Serializable, for: Operately.Activities.Content.TaskDescriptionChange do
  alias OperatelyWeb.Api.Serializer

  def serialize(content, level: :essential) do
    %{
      task: Serializer.serialize(content["task"], level: :full),
      project_name: Serializer.serialize(content["project_name"], level: :essential),
    }
  end
end

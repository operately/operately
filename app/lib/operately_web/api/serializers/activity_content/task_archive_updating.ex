defimpl OperatelyWeb.Api.Serializable, for: Operately.Activities.Content.TaskArchiveUpdating do
  alias OperatelyWeb.Api.Serializer

  def serialize(content, level: :essential) do
    %{
      space: Serializer.serialize(content["space"], level: :essential),
      project: Serializer.serialize(content["project"], level: :essential),
      task: Serializer.serialize(content["task"], level: :essential),
      name: content["name"],
      archived: content["archived"]
    }
  end
end

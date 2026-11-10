defimpl OperatelyWeb.Api.Serializable, for: Operately.Activities.Content.TaskBoardCreated do
  alias OperatelyWeb.Api.Serializer

  def serialize(content, level: :essential) do
    %{
      space: Serializer.serialize(content["space"], level: :essential),
      board_id: Operately.ShortUuid.encode!(content["board_id"]),
      name: content["name"]
    }
  end
end

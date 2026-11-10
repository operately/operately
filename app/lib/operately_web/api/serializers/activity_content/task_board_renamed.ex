defimpl OperatelyWeb.Api.Serializable, for: Operately.Activities.Content.TaskBoardRenamed do
  alias OperatelyWeb.Api.Serializer

  def serialize(content, level: :essential) do
    %{
      space: Serializer.serialize(content["space"], level: :essential),
      board_id: Operately.ShortUuid.encode!(content["board_id"]),
      old_name: content["old_name"],
      new_name: content["new_name"]
    }
  end
end

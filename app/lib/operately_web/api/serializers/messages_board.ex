defimpl OperatelyWeb.Api.Serializable, for: Operately.Messages.MessagesBoard do
  def serialize(messages_board, level: :essential) do
    %{
      id: OperatelyWeb.Paths.messages_board_id(messages_board),
      name: messages_board.name,
      description: Jason.encode!(messages_board.description),
      messages: OperatelyWeb.Api.Serializer.serialize(messages_board.messages),
      space: OperatelyWeb.Api.Serializer.serialize(messages_board.space),
      inserted_at: OperatelyWeb.Api.Serializer.serialize(messages_board.inserted_at),
      updated_at: OperatelyWeb.Api.Serializer.serialize(messages_board.updated_at),
    }
  end
end

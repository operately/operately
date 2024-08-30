defimpl OperatelyWeb.Api.Serializable, for: Operately.Updates.Reaction do
  def serialize(reaction, level: :essential) do
    %{
      id: reaction.id,
      emoji: reaction.emoji,
      person: OperatelyWeb.Api.Serializer.serialize(reaction.person),
    }
  end
end

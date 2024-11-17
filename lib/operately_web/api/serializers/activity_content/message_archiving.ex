defimpl OperatelyWeb.Api.Serializable, for: Operately.Activities.Content.MessageArchiving do
  alias OperatelyWeb.Api.Serializer

  def serialize(content, level: :essential) do
    %{
      company_id: Serializer.serialize(content["company_id"], level: :essential),
      space_id: Serializer.serialize(content["space_id"], level: :essential),
      message_id: Serializer.serialize(content["message_id"], level: :essential)
    }
  end
end

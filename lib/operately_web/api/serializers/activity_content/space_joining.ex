defimpl OperatelyWeb.Api.Serializable, for: Operately.Activities.Content.SpaceJoining do
  def serialize(content, level: :essential) do
    %{
      space: OperatelyWeb.Api.Serializer.serialize(content["space"], level: :essential),
    }
  end
end

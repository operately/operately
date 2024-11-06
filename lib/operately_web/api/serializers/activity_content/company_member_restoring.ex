defimpl OperatelyWeb.Api.Serializable, for: Operately.Activities.Content.CompanyMemberRestoring do
  alias OperatelyWeb.Api.Serializer

  def serialize(content, level: :essential) do
    %{
      person: Serializer.serialize(content["person"], level: :essential)
    }
  end
end

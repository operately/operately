defimpl OperatelyWeb.Api.Serializable, for: Operately.Activities.Content.CompanyMemberAdded do
  alias OperatelyWeb.Api.Serializer

  def serialize(content, level: :essential) do
    %{
      company: Serializer.serialize(content["company"], level: :essential),
      person: Serializer.serialize(content["person"], level: :essential),
      name: content["name"],
    }
  end
end

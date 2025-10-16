defimpl OperatelyWeb.Api.Serializable, for: Operately.Activities.Content.CompanyOwnerRemoving do
  alias OperatelyWeb.Api.Serializer

  def serialize(content, level: :essential) do
    %{
      company: Serializer.serialize(content["company"], level: :essential),
      person: Serializer.serialize(content["person"], level: :essential)
    }
  end
end

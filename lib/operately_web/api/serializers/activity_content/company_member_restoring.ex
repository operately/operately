defimpl OperatelyWeb.Api.Serializable, for: Operately.Activities.Content.CompanyMemberRestoring do
  alias OperatelyWeb.Api.Serializer

  def serialize(content, level: :essential) do
    %{
      company_id: Serializer.serialize(content["company_id"], level: :essential),
      person_id: Serializer.serialize(content["person_id"], level: :essential)
    }
  end
end

defimpl OperatelyWeb.Api.Serializable, for: Operately.Activities.Content.CompanyOwnerRemoving do
  alias OperatelyWeb.Api.Serializer

  def serialize(content, level: :essential) do
    %{
      person: Serializer.serialize(content["person"], level: :essential),
      person_id: content["person_id"],
      company_id: content["company_id"]
    }
  end
end

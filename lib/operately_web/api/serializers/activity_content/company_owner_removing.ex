defimpl OperatelyWeb.Api.Serializable, for: Operately.Activities.Content.CompanyOwnerRemoving do
  alias OperatelyWeb.Api.Serializer

  def serialize(content, level: :essential) do
    %{
      company_id: Serializer.serialize(content["company_id"], level: :essential),
      owner_id: Serializer.serialize(content["owner_id"], level: :essential)
    }
  end
end

defimpl OperatelyWeb.Api.Serializable, for: Operately.Activities.Content.CompanyOwnersAdding do
  alias OperatelyWeb.Api.Serializer

  def serialize(content, level: :essential) do
    %{
      company_id: Serializer.serialize(content["company_id"], level: :essential),
      owners: Serializer.serialize(content["owners"], level: :essential)
    }
  end
end

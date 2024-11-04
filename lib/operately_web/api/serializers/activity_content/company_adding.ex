defimpl OperatelyWeb.Api.Serializable, for: Operately.Activities.Content.CompanyAdding do
  def serialize(content, level: :essential) do
    %{
      company: OperatelyWeb.Api.Serializer.serialize(content["company"], level: :essential),
      creator: OperatelyWeb.Api.Serializer.serialize(content["creator"], level: :essential)
    }
  end
end

defimpl OperatelyWeb.Api.Serializable, for: Operately.Activities.Content.CompanyOwnersAdding do
  alias OperatelyWeb.Api.Serializer

  def serialize(content, level: :essential) do
    %{
      people: Serializer.serialize(content["people"], level: :essential)
    }
  end
end

defimpl OperatelyWeb.Api.Serializable, for: Operately.Activities.Content.CompanyOwnersAdding.Owner do
  alias OperatelyWeb.Api.Serializer

  def serialize(content, level: :essential) do
    %{
      person: Serializer.serialize(content["person"], level: :essential)
    }
  end
end

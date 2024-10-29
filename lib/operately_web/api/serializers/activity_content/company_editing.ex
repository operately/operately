defimpl OperatelyWeb.Api.Serializable, for: Operately.Activities.Content.CompanyEditing do
  def serialize(content, level: :essential) do
    %{
      company: OperatelyWeb.Api.Serializer.serialize(content["company"], level: :essential),
      old_name: content["old_name"],
      new_name: content["new_name"]
    }
  end
end

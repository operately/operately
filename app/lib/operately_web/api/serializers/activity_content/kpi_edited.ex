defimpl OperatelyWeb.Api.Serializable, for: Operately.Activities.Content.KpiEdited do
  alias OperatelyWeb.Api.Serializer

  def serialize(content, level: :essential) do
    %{
      space: Serializer.serialize(content.space, level: :essential),
      kpi: Serializer.serialize(content.kpi, level: :essential),
      old_name: content.old_name,
      new_name: content.new_name
    }
  end
end

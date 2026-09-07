defimpl OperatelyWeb.Api.Serializable, for: Operately.Activities.Content.KpiEntryDeleted do
  alias OperatelyWeb.Api.Serializer

  def serialize(content, level: :essential) do
    %{
      space: Serializer.serialize(content.space, level: :essential),
      kpi: Serializer.serialize(content.kpi, level: :essential),
      value: content.value,
      period: Serializer.serialize(content.period)
    }
  end
end

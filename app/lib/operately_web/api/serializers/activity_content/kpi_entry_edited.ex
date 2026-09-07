defimpl OperatelyWeb.Api.Serializable, for: Operately.Activities.Content.KpiEntryEdited do
  alias OperatelyWeb.Api.Serializer

  def serialize(content, level: :essential) do
    %{
      space: Serializer.serialize(content.space, level: :essential),
      kpi: Serializer.serialize(content.kpi, level: :essential),
      entry: Serializer.serialize(content.entry, level: :essential),
      old_value: content.old_value,
      new_value: content.new_value,
      old_period: Serializer.serialize(content.old_period),
      new_period: Serializer.serialize(content.new_period)
    }
  end
end

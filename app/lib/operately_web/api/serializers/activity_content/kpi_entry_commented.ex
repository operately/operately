defimpl OperatelyWeb.Api.Serializable, for: Operately.Activities.Content.KpiEntryCommented do
  alias OperatelyWeb.Api.Serializer

  def serialize(content, level: :essential) do
    %{
      space: Serializer.serialize(content.space, level: :essential),
      kpi: Serializer.serialize(content.kpi, level: :essential),
      entry: Serializer.serialize(content.entry, level: :essential),
      comment: Serializer.serialize(content.comment)
    }
  end
end

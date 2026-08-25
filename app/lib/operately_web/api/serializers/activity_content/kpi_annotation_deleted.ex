defimpl OperatelyWeb.Api.Serializable, for: Operately.Activities.Content.KpiAnnotationDeleted do
  alias OperatelyWeb.Api.Serializer

  def serialize(content, level: :essential) do
    %{
      space: Serializer.serialize(content.space, level: :essential),
      kpi: Serializer.serialize(content.kpi, level: :essential),
      title: content.title,
      date: Serializer.serialize(content.date)
    }
  end
end

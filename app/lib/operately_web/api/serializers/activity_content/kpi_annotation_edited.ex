defimpl OperatelyWeb.Api.Serializable, for: Operately.Activities.Content.KpiAnnotationEdited do
  alias OperatelyWeb.Api.Serializer

  def serialize(content, level: :essential) do
    %{
      space: Serializer.serialize(content.space, level: :essential),
      kpi: Serializer.serialize(content.kpi, level: :essential),
      annotation: Serializer.serialize(content.annotation, level: :essential),
      old_title: content.old_title,
      new_title: content.new_title,
      date: Serializer.serialize(content.date)
    }
  end
end

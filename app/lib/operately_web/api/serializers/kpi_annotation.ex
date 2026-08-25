defimpl OperatelyWeb.Api.Serializable, for: Operately.Kpis.KpiAnnotation do
  alias OperatelyWeb.Api.Serializer

  def serialize(annotation, level: :essential) do
    %{
      id: OperatelyWeb.Paths.kpi_annotation_id(annotation),
      date: Serializer.serialize(annotation.date),
      title: annotation.title,
      description: annotation.description,
      created_by: Serializer.serialize(annotation.created_by),
      inserted_at: Serializer.serialize(annotation.inserted_at),
      updated_at: Serializer.serialize(annotation.updated_at)
    }
  end
end

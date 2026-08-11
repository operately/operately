defimpl OperatelyWeb.Api.Serializable, for: Operately.Activities.Content.KpiCreated do
  alias OperatelyWeb.Api.Serializer

  def serialize(content, level: :essential) do
    %{
      company_id: Serializer.serialize(content["company_id"], level: :essential),
      company: Serializer.serialize(content["company"], level: :essential),
      space_id: Serializer.serialize(content["space_id"], level: :essential),
      space: Serializer.serialize(content["space"], level: :essential),
      kpi_id: Serializer.serialize(content["kpi_id"], level: :essential),
      kpi: Serializer.serialize(content["kpi"], level: :essential),
      champion_id: Serializer.serialize(content["champion_id"], level: :essential),
      champion: Serializer.serialize(content["champion"], level: :essential),
      kpi_name: Serializer.serialize(content["kpi_name"], level: :essential)
    }
  end
end

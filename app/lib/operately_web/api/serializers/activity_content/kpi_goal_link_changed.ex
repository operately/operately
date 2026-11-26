defimpl OperatelyWeb.Api.Serializable, for: Operately.Activities.Content.KpiGoalLinkChanged do
  alias OperatelyWeb.Api.Serializer

  def serialize(content, level: :essential) do
    %{
      space: Serializer.serialize(content.space, level: :essential),
      kpi: Serializer.serialize(content.kpi, level: :essential),
      kpi_name: content.kpi_name,
      linked: content.linked
    }
  end
end

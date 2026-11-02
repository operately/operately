defimpl OperatelyWeb.Api.Serializable, for: Operately.Activities.Content.KpiDeleted do
  alias OperatelyWeb.Api.Serializer

  def serialize(content, level: :essential) do
    %{
      space: Serializer.serialize(content.space, level: :essential),
      kpi_name: content.kpi_name
    }
  end
end

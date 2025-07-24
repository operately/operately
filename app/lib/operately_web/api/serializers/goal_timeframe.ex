defimpl OperatelyWeb.Api.Serializable, for: Operately.ContextualDates.Timeframe do
  def serialize(timeframe, level: :essential) do
    %{
      contextual_start_date: OperatelyWeb.Api.Serializer.serialize(timeframe.contextual_start_date),
      contextual_end_date: OperatelyWeb.Api.Serializer.serialize(timeframe.contextual_end_date)
    }
  end
end

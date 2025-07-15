defimpl OperatelyWeb.Api.Serializable, for: Operately.Goals.Timeframe do
  def serialize(timeframe, level: :essential) do
    %{
      type: timeframe.type,
      start_date: OperatelyWeb.Api.Serializer.serialize(timeframe.start_date),
      end_date: OperatelyWeb.Api.Serializer.serialize(timeframe.end_date),
      contextual_start_date: OperatelyWeb.Api.Serializer.serialize(timeframe.contextual_start_date),
      contextual_end_date: OperatelyWeb.Api.Serializer.serialize(timeframe.contextual_end_date)
    }
  end
end

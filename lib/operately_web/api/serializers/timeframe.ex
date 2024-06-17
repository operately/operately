defmodule OperatelyWeb.Api.Serializers.Timeframe do
  def serialize(timeframe) do
    %{
      start_date: timeframe["start_date"],
      end_date: timeframe["end_date"],
      type: timeframe["type"]
    }
  end
end

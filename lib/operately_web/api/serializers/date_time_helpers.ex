defmodule OperatelyWeb.Api.Serializers.DateTimeHelpers do
  def serialize_datetime(nil), do: nil
  def serialize_datetime(%DateTime{} = datetime), do: DateTime.to_iso8601(datetime)
  def serialize_datetime(%NaiveDateTime{} = naive_datetime), do: NaiveDateTime.to_iso8601(naive_datetime)
  def serialize_datetime(%Date{} = date), do: Date.to_iso8601(date)
  def serialize_datetime(other), do: other
end

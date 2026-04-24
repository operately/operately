defmodule Operately.CompanyTransfers.Import.RowDeserializer do
  @moduledoc """
  Converts exported row payloads back into values Ecto can cast on import.
  """

  def deserialize_row(row) when is_map(row) do
    Enum.into(row, %{}, fn {key, value} -> {key, deserialize_value(value)} end)
  end

  defp deserialize_value(nil), do: nil
  defp deserialize_value(value) when is_boolean(value) or is_integer(value) or is_float(value), do: value
  defp deserialize_value(value) when is_binary(value), do: value

  defp deserialize_value(%{"__type__" => type} = value) do
    case type do
      "bytea" ->
        Base.decode64!(value["value"])

      "decimal" ->
        value["value"]

      "date" ->
        value["value"]

      "time" ->
        value["value"]

      "naive_datetime" ->
        value["value"]

      "utc_datetime" ->
        value["value"]

      _ ->
        Enum.into(value, %{}, fn {key, nested_value} -> {key, deserialize_value(nested_value)} end)
    end
  end

  defp deserialize_value(value) when is_map(value) do
    Enum.into(value, %{}, fn {key, nested_value} -> {key, deserialize_value(nested_value)} end)
  end

  defp deserialize_value(value) when is_list(value) do
    Enum.map(value, &deserialize_value/1)
  end
end

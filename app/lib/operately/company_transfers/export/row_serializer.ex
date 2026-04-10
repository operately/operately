defmodule Operately.CompanyTransfers.Export.RowSerializer do
  def serialize_row(row, column_types) when is_map(row) and is_map(column_types) do
    Enum.into(row, %{}, fn {column, value} ->
      type = Map.get(column_types, column)
      {column, serialize_value(value, type)}
    end)
  end

  defp serialize_value(nil, _type), do: nil
  defp serialize_value(value, _type) when is_boolean(value) or is_integer(value) or is_float(value), do: value

  defp serialize_value(value, type) when is_binary(value) do
    if type == "bytea" or not String.valid?(value) do
      %{
        "__type__" => "bytea",
        "encoding" => "base64",
        "value" => Base.encode64(value)
      }
    else
      value
    end
  end

  defp serialize_value(%Decimal{} = value, _type) do
    %{
      "__type__" => "decimal",
      "value" => Decimal.to_string(value)
    }
  end

  defp serialize_value(%Date{} = value, _type) do
    %{
      "__type__" => "date",
      "value" => Date.to_iso8601(value)
    }
  end

  defp serialize_value(%Time{} = value, _type) do
    %{
      "__type__" => "time",
      "value" => Time.to_iso8601(value)
    }
  end

  defp serialize_value(%NaiveDateTime{} = value, _type) do
    %{
      "__type__" => "naive_datetime",
      "value" => NaiveDateTime.to_iso8601(value)
    }
  end

  defp serialize_value(%DateTime{} = value, _type) do
    %{
      "__type__" => "utc_datetime",
      "value" => DateTime.to_iso8601(value)
    }
  end

  defp serialize_value(value, type) when is_list(value) do
    Enum.map(value, &serialize_value(&1, array_element_type(type)))
  end

  defp serialize_value(value, _type) when is_map(value) do
    Enum.into(value, %{}, fn {key, nested_value} -> {key, serialize_value(nested_value, nil)} end)
  end

  defp serialize_value(value, _type), do: to_string(value)

  defp array_element_type("ARRAY"), do: nil
  defp array_element_type(type), do: type
end

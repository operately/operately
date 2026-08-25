defmodule OperatelyWeb.Mcp.InputValidator do
  @moduledoc """
  Validates MCP tool arguments against the schema subset emitted by the catalog.
  """

  def validate(schema, arguments) when is_map(schema) and is_map(arguments) do
    validate_object(arguments, schema, "")
  end

  def validate(_schema, _arguments), do: {:error, :invalid_arguments}

  defp validate_object(value, %{"type" => "object", "properties" => properties} = schema, path)
       when is_map(value) and is_map(properties) do
    with :ok <- validate_required_keys(schema, value, path),
         :ok <- validate_unexpected_keys(schema, value, path),
         :ok <- validate_properties(schema, value, path) do
      :ok
    end
  end

  defp validate_object(_value, %{"type" => "object"}, path), do: invalid_type(path, "object")
  defp validate_object(_value, _schema, _path), do: {:error, :invalid_schema}

  defp validate_required_keys(schema, arguments, path) do
    schema
    |> Map.get("required", [])
    |> Enum.find_value(:ok, fn key ->
      if Map.has_key?(arguments, key), do: false, else: {:error, {:missing_required_key, join_path(path, key)}}
    end)
  end

  defp validate_unexpected_keys(%{"properties" => properties} = schema, arguments, path) do
    if Map.get(schema, "additionalProperties", true) do
      :ok
    else
      arguments
      |> Map.keys()
      |> Enum.find_value(:ok, fn key ->
        if Map.has_key?(properties, key), do: false, else: {:error, {:unexpected_key, join_path(path, key)}}
      end)
    end
  end

  defp validate_properties(%{"properties" => properties}, arguments, path) do
    Enum.reduce_while(arguments, :ok, fn {key, value}, :ok ->
      case Map.fetch(properties, key) do
        {:ok, property_schema} ->
          case validate_value(value, property_schema, join_path(path, key)) do
            :ok -> {:cont, :ok}
            error -> {:halt, error}
          end

        :error ->
          {:cont, :ok}
      end
    end)
  end

  defp validate_value(nil, %{"type" => types}, _path) when is_list(types) do
    if "null" in types, do: :ok, else: {:error, :invalid_schema}
  end

  defp validate_value(value, %{"type" => types} = schema, path) when is_list(types) do
    non_null_types = Enum.reject(types, &(&1 == "null"))

    case non_null_types do
      [type] -> validate_value(value, Map.put(schema, "type", type), path)
      _ -> {:error, :invalid_schema}
    end
  end

  defp validate_value(value, %{"type" => "string"} = schema, path) do
    cond do
      not is_binary(value) ->
        invalid_type(path, "string")

      is_list(schema["enum"]) and value not in schema["enum"] ->
        {:error, {:invalid_enum, path}}

      Map.get(schema, "format") == "uri" and not valid_uri?(value) ->
        {:error, {:invalid_format, path, "uri"}}

      true ->
        :ok
    end
  end

  defp validate_value(value, %{"type" => "boolean"}, path) do
    if is_boolean(value), do: :ok, else: invalid_type(path, "boolean")
  end

  defp validate_value(value, %{"type" => "integer"} = schema, path) do
    cond do
      not is_integer(value) -> invalid_type(path, "integer")
      is_integer(schema["minimum"]) and value < schema["minimum"] -> {:error, {:invalid_minimum, path, schema["minimum"]}}
      true -> :ok
    end
  end

  defp validate_value(value, %{"type" => "object"} = schema, path), do: validate_object(value, schema, path)

  defp validate_value(value, %{"type" => "array", "items" => items_schema}, path) when is_list(value) do
    value
    |> Enum.with_index()
    |> Enum.reduce_while(:ok, fn {item, index}, :ok ->
      case validate_value(item, items_schema, "#{path}[#{index}]") do
        :ok -> {:cont, :ok}
        error -> {:halt, error}
      end
    end)
  end

  defp validate_value(_value, %{"type" => "array"}, path), do: invalid_type(path, "array")
  defp validate_value(_value, _schema, _path), do: {:error, :invalid_schema}

  defp invalid_type(path, type), do: {:error, {:invalid_type, path, type}}
  defp join_path("", key), do: key
  defp join_path(path, key), do: "#{path}.#{key}"

  defp valid_uri?(value) do
    uri = URI.parse(value)
    is_binary(uri.scheme) and uri.scheme != "" and is_binary(uri.host) and uri.host != ""
  end
end

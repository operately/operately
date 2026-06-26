defmodule OperatelyWeb.Mcp.InputValidator do
  @moduledoc """
  Validates MCP tool arguments against the schema subset emitted by the catalog.
  """

  def validate(schema, arguments) when is_map(schema) and is_map(arguments) do
    with :ok <- validate_root_schema(schema),
         :ok <- validate_required_keys(schema, arguments),
         :ok <- validate_unexpected_keys(schema, arguments),
         :ok <- validate_properties(schema, arguments) do
      :ok
    end
  end

  def validate(_schema, _arguments), do: {:error, :invalid_arguments}

  defp validate_root_schema(%{"type" => "object", "properties" => properties}) when is_map(properties), do: :ok
  defp validate_root_schema(_schema), do: {:error, :invalid_schema}

  defp validate_required_keys(schema, arguments) do
    schema
    |> Map.get("required", [])
    |> Enum.find_value(:ok, fn key ->
      if Map.has_key?(arguments, key), do: false, else: {:error, {:missing_required_key, key}}
    end)
  end

  defp validate_unexpected_keys(%{"properties" => properties} = schema, arguments) do
    if Map.get(schema, "additionalProperties", true) do
      :ok
    else
      arguments
      |> Map.keys()
      |> Enum.find_value(:ok, fn key ->
        if Map.has_key?(properties, key), do: false, else: {:error, {:unexpected_key, key}}
      end)
    end
  end

  defp validate_properties(%{"properties" => properties}, arguments) do
    Enum.reduce_while(arguments, :ok, fn {key, value}, :ok ->
      case Map.fetch(properties, key) do
        {:ok, property_schema} ->
          case validate_property(key, value, property_schema) do
            :ok -> {:cont, :ok}
            error -> {:halt, error}
          end

        :error ->
          {:cont, :ok}
      end
    end)
  end

  defp validate_property(key, value, %{"type" => "string"} = schema) do
    cond do
      not is_binary(value) ->
        {:error, {:invalid_type, key, "string"}}

      is_list(schema["enum"]) and value not in schema["enum"] ->
        {:error, {:invalid_enum, key}}

      Map.get(schema, "format") == "uri" and not valid_uri?(value) ->
        {:error, {:invalid_format, key, "uri"}}

      true ->
        :ok
    end
  end

  defp validate_property(key, value, %{"type" => "boolean"}) do
    if is_boolean(value), do: :ok, else: {:error, {:invalid_type, key, "boolean"}}
  end

  defp validate_property(key, value, %{"type" => "array", "items" => items_schema}) do
    if is_list(value) and Enum.all?(value, &valid_array_item?(&1, items_schema)) do
      :ok
    else
      {:error, {:invalid_type, key, "array"}}
    end
  end

  defp validate_property(_key, _value, _schema), do: {:error, :invalid_schema}

  defp valid_array_item?(value, %{"type" => "string"}), do: is_binary(value)
  defp valid_array_item?(_value, _schema), do: false

  defp valid_uri?(value) do
    uri = URI.parse(value)
    is_binary(uri.scheme) and uri.scheme != "" and is_binary(uri.host) and uri.host != ""
  end
end

defmodule OperatelyWeb.Mcp.Catalog.JsonSchema do
  def object(properties, opts \\ []) when is_map(properties) do
    required = Keyword.get(opts, :required, [])
    additional_properties = Keyword.get(opts, :additional_properties, false)

    %{
      "type" => "object",
      "properties" => properties,
      "additionalProperties" => additional_properties
    }
    |> put_if_present("description", Keyword.get(opts, :description))
    |> put_if_present("required", required, required != [])
  end

  def any_object(description \\ nil) do
    %{
      "type" => "object",
      "additionalProperties" => true
    }
    |> put_if_present("description", description)
  end

  def string(description, opts \\ []) when is_binary(description) do
    %{"type" => "string", "description" => description}
    |> put_if_present("format", Keyword.get(opts, :format))
  end

  def boolean(description, opts \\ []) when is_binary(description) do
    %{"type" => "boolean", "description" => description}
    |> put_if_present("default", Keyword.get(opts, :default), Keyword.has_key?(opts, :default))
  end

  def array(items, opts \\ []) when is_map(items) do
    %{
      "type" => "array",
      "items" => items
    }
    |> put_if_present("description", Keyword.get(opts, :description))
  end

  defp put_if_present(map, _key, _value, false), do: map
  defp put_if_present(map, _key, nil, _condition), do: map
  defp put_if_present(map, key, value, _condition), do: Map.put(map, key, value)

  defp put_if_present(map, key, value), do: put_if_present(map, key, value, true)
end

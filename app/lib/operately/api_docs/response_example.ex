defmodule Operately.ApiDocs.ResponseExample do
  @moduledoc false

  @builtins [:string, :integer, :float, :boolean, :date, :time, :datetime]
  @max_object_depth 1

  def render(endpoint, types) do
    endpoint.outputs
    |> build_outputs(types)
    |> encode_pretty_json()
  end

  defp build_outputs(fields, types) do
    Enum.reduce(fields, %{}, fn {name, type, _opts}, acc ->
      Map.put(acc, name, sample_for(type, types, MapSet.new(), 0))
    end)
  end

  defp sample_for({:list, inner}, types, seen, depth) do
    [sample_for(inner, types, seen, depth)]
  end

  defp sample_for(type, _types, _seen, _depth) when type in @builtins do
    case type do
      :string -> "value"
      :integer -> 123
      :float -> 12.34
      :boolean -> true
      :date -> "2026-01-01"
      :time -> "09:30:00"
      :datetime -> "2026-01-01T09:30:00Z"
    end
  end

  defp sample_for(type, types, seen, depth) when is_atom(type) do
    cond do
      MapSet.member?(seen, type) ->
        fallback(type)

      Map.has_key?(types.enums, type) ->
        enum_value(types.enums[type], type)

      Map.has_key?(types.primitives, type) ->
        primitive_value(type, types, seen, depth)

      Map.has_key?(types.objects, type) ->
        object_value(type, types, seen, depth)

      Map.has_key?(types.unions, type) ->
        fallback(type)

      true ->
        fallback(type)
    end
  end

  defp sample_for(type, _types, _seen, _depth), do: fallback(type)

  defp primitive_value(type, types, seen, depth) do
    encoded_type =
      types.primitives
      |> Map.get(type, [])
      |> Keyword.get(:encoded_type)

    if encoded_type do
      sample_for(encoded_type, types, MapSet.put(seen, type), depth)
    else
      fallback(type)
    end
  end

  defp object_value(type, _types, _seen, depth) when depth >= @max_object_depth do
    # Keep response samples compact by collapsing nested objects into typed references.
    fallback(type)
  end

  defp object_value(type, types, seen, depth) do
    object = Map.get(types.objects, type, %{fields: []})
    seen = MapSet.put(seen, type)

    Enum.reduce(object.fields, %{}, fn {name, field_type, _opts}, acc ->
      Map.put(acc, name, sample_for(field_type, types, seen, depth + 1))
    end)
  end

  defp enum_value([], type), do: fallback(type)

  defp enum_value([value | _], _type) do
    case value do
      v when is_atom(v) -> Atom.to_string(v)
      v when is_binary(v) -> v
      v -> to_string(v)
    end
  end

  defp fallback(type) do
    label =
      cond do
        is_atom(type) -> Atom.to_string(type)
        is_binary(type) -> type
        true -> inspect(type)
      end

    "<#{label}>"
  end

  defp encode_pretty_json(value), do: encode_json(value, 0)

  defp encode_json(map, indent) when is_map(map) do
    entries = map |> Enum.sort_by(fn {key, _value} -> to_string(key) end)

    if entries == [] do
      "{}"
    else
      inner_indent = indent + 2

      body =
        entries
        |> Enum.map_join(",\n", fn {key, value} ->
          "#{spaces(inner_indent)}#{Jason.encode!(to_string(key))}: #{encode_json(value, inner_indent)}"
        end)

      "{\n#{body}\n#{spaces(indent)}}"
    end
  end

  defp encode_json(list, indent) when is_list(list) do
    if list == [] do
      "[]"
    else
      inner_indent = indent + 2

      body =
        list
        |> Enum.map_join(",\n", fn value ->
          "#{spaces(inner_indent)}#{encode_json(value, inner_indent)}"
        end)

      "[\n#{body}\n#{spaces(indent)}]"
    end
  end

  defp encode_json(value, _indent), do: Jason.encode!(value)

  defp spaces(size), do: String.duplicate(" ", size)
end

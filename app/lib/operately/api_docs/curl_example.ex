defmodule Operately.ApiDocs.CurlExample do
  @moduledoc false

  @base_url "https://app.operately.com"
  @api_token "${OPERATELY_API_TOKEN}"
  @builtins [:string, :integer, :float, :boolean, :date, :time, :datetime]

  def command(endpoint, types) do
    inputs = build_inputs(endpoint.inputs, types)

    lines =
      case endpoint.type do
        :query -> build_query_lines(endpoint.path, inputs)
        :mutation -> build_mutation_lines(endpoint.path, inputs)
      end

    Enum.join(lines, " \\\n")
  end

  def render(endpoint, types) do
    curl_command = command(endpoint, types)

    """
    ```bash
    #{curl_command}
    ```
    """
  end

  defp build_query_lines(path, inputs) do
    query = build_query_string(inputs)
    url = if query == "", do: "#{@base_url}#{path}", else: "#{@base_url}#{path}?#{query}"

    [
      "curl --request GET",
      ~s(  --url "#{url}"),
      ~s(  --header "Authorization: Bearer #{@api_token}")
    ]
  end

  defp build_mutation_lines(path, inputs) do
    base_lines = [
      "curl --request POST",
      ~s(  --url "#{@base_url}#{path}"),
      ~s(  --header "Authorization: Bearer #{@api_token}")
    ]

    if map_size(inputs) == 0 do
      base_lines
    else
      body = inputs |> stringify_map_keys() |> encode_json_with_comma_space()

      base_lines ++
        [
          ~s(  --header "Content-Type: application/json"),
          ~s(  --data '#{body}')
        ]
    end
  end

  defp build_query_string(inputs) do
    if map_size(inputs) == 0 do
      ""
    else
      inputs
      |> stringify_map_keys()
      |> Plug.Conn.Query.encode()
    end
  end

  defp build_inputs(fields, types) do
    Enum.reduce(fields, %{}, fn {name, type, _opts}, acc ->
      Map.put(acc, name, sample_for(type, types, MapSet.new()))
    end)
  end

  defp sample_for({:list, inner}, types, seen) do
    [sample_for(inner, types, seen)]
  end

  defp sample_for(type, _types, _seen) when type in @builtins do
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

  defp sample_for(type, types, seen) when is_atom(type) do
    cond do
      MapSet.member?(seen, type) ->
        fallback(type)

      Map.has_key?(types.enums, type) ->
        enum_value(types.enums[type], type)

      Map.has_key?(types.primitives, type) ->
        primitive_value(type, types, seen)

      Map.has_key?(types.objects, type) ->
        object_value(type, types, seen)

      Map.has_key?(types.unions, type) ->
        fallback(type)

      true ->
        fallback(type)
    end
  end

  defp sample_for(type, _types, _seen), do: fallback(type)

  defp primitive_value(type, types, seen) do
    encoded_type =
      types.primitives
      |> Map.get(type, [])
      |> Keyword.get(:encoded_type)

    if encoded_type do
      sample_for(encoded_type, types, MapSet.put(seen, type))
    else
      fallback(type)
    end
  end

  defp object_value(type, types, seen) do
    object = Map.get(types.objects, type, %{fields: []})
    seen = MapSet.put(seen, type)

    Enum.reduce(object.fields, %{}, fn {name, field_type, _opts}, acc ->
      Map.put(acc, name, sample_for(field_type, types, seen))
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

  defp stringify_map_keys(map) when is_map(map) do
    Enum.reduce(map, %{}, fn {key, value}, acc ->
      Map.put(acc, to_string(key), stringify_map_keys(value))
    end)
  end

  defp stringify_map_keys(list) when is_list(list), do: Enum.map(list, &stringify_map_keys/1)
  defp stringify_map_keys(value), do: value

  defp encode_json_with_comma_space(map) when is_map(map) do
    entries =
      map
      |> Enum.sort_by(fn {key, _value} -> key end)
      |> Enum.map_join(", ", fn {key, value} ->
        Jason.encode!(key) <> ":" <> encode_json_with_comma_space(value)
      end)

    "{#{entries}}"
  end

  defp encode_json_with_comma_space(list) when is_list(list) do
    items =
      list
      |> Enum.map_join(", ", &encode_json_with_comma_space/1)

    "[#{items}]"
  end

  defp encode_json_with_comma_space(value), do: Jason.encode!(value)
end

defmodule Operately.ApiDocs.Catalog do
  @moduledoc false

  @schema_version 1

  def payload(catalog, api_base_path) do
    %{
      schema_version: @schema_version,
      api_base_path: api_base_path,
      endpoint_count: length(catalog.endpoints),
      query_count: length(catalog.queries),
      mutation_count: length(catalog.mutations),
      types: serialize_types(catalog.types),
      endpoints: Enum.map(catalog.endpoints, &serialize_endpoint/1),
      namespace_descriptions: serialize_namespace_descriptions(catalog.namespace_descriptions)
    }
  end

  # Object key order is fixed to keep `make gen.cli.catalog` byte-stable.
  # OTP 27 iterates atom-keyed maps by atom-table order, which changes across compilations.
  @payload_key_order ~w(types namespace_descriptions api_base_path endpoint_count endpoints query_count mutation_count schema_version)
  @types_key_order ~w(enums int_enums primitives unions objects)
  @endpoint_key_order ~w(name type path handler outputs inputs full_name method namespace docstring hidden)
  @field_key_order ~w(default name type optional nullable has_default)
  @named_type_key_order ~w(name kind)
  @list_type_key_order ~w(item kind)

  def encode(payload, previous \\ nil) do
    payload
    |> ordered_payload(previous)
    |> Jason.encode!(pretty: true, maps: :strict)
  end

  defp ordered_payload(payload, previous) do
    order_map(payload, @payload_key_order, fn
      "types", types -> ordered_types(types, previous && previous["types"])
      "namespace_descriptions", descriptions -> order_string_key_map(descriptions, previous && previous["namespace_descriptions"])
      "endpoints", endpoints -> Enum.map(endpoints, &ordered_endpoint/1)
      _key, value -> value
    end)
  end

  defp ordered_types(types, previous) do
    order_map(types, @types_key_order, fn
      "primitives", primitives ->
        order_string_key_map(primitives, previous && previous["primitives"], fn primitive -> order_map(primitive, ["encoded_type"]) end)

      "objects", objects ->
        order_string_key_map(objects, previous && previous["objects"], fn object ->
          order_map(object, ["fields"], fn "fields", fields -> Enum.map(fields, &ordered_field/1) end)
        end)

      "unions", unions ->
        order_string_key_map(unions, previous && previous["unions"], fn refs -> Enum.map(refs, &ordered_type_ref/1) end)

      key, values ->
        order_string_key_map(values, previous && previous[key])
    end)
  end

  defp ordered_endpoint(endpoint) do
    order_map(endpoint, @endpoint_key_order, fn
      key, fields when key in ["inputs", "outputs"] -> Enum.map(fields, &ordered_field/1)
      _key, value -> value
    end)
  end

  defp ordered_field(field) do
    order_map(field, @field_key_order, fn
      "type", type -> ordered_type_ref(type)
      "default", default -> ordered_json_value(default)
      _key, value -> value
    end)
  end

  defp ordered_type_ref(%{kind: kind} = type_ref) when kind in ["list", :list] do
    order_map(type_ref, @list_type_key_order, fn
      "item", item -> ordered_type_ref(item)
      _key, value -> value
    end)
  end

  defp ordered_type_ref(type_ref) when is_map(type_ref) do
    order_map(type_ref, @named_type_key_order)
  end

  defp ordered_json_value(map) when is_map(map), do: order_string_key_map(map, nil, &ordered_json_value/1)
  defp ordered_json_value(list) when is_list(list), do: Enum.map(list, &ordered_json_value/1)
  defp ordered_json_value(value), do: value

  defp order_map(map, key_order, transform \\ fn _key, value -> value end) do
    string_map = Map.new(map, fn {key, value} -> {to_string(key), value} end)

    known_keys = Enum.filter(key_order, &Map.has_key?(string_map, &1))

    unknown_keys =
      string_map
      |> Map.keys()
      |> Enum.reject(&(&1 in key_order))
      |> Enum.sort()

    (known_keys ++ unknown_keys)
    |> Enum.map(fn key -> {key, transform.(key, Map.fetch!(string_map, key))} end)
    |> Jason.OrderedObject.new()
  end

  defp order_string_key_map(map, previous), do: order_string_key_map(map, previous, fn value -> value end)

  defp order_string_key_map(map, previous, transform_value) do
    current = Map.new(map, fn {key, value} -> {to_string(key), value} end)
    previous_keys = Enum.filter(previous_keys(previous), &Map.has_key?(current, &1))
    new_keys = current |> Map.keys() |> Enum.reject(&(&1 in previous_keys)) |> Enum.sort()

    (previous_keys ++ new_keys)
    |> Enum.map(fn key -> {key, transform_value.(Map.fetch!(current, key))} end)
    |> Jason.OrderedObject.new()
  end

  defp previous_keys(%Jason.OrderedObject{values: values}), do: Enum.map(values, fn {key, _} -> to_string(key) end)
  defp previous_keys(map) when is_map(map), do: Enum.map(Map.keys(map), &to_string/1)
  defp previous_keys(_), do: []

  defp serialize_types(types) do
    %{
      primitives: serialize_primitives(types.primitives),
      objects: serialize_objects(types.objects),
      enums: serialize_enums(types.enums),
      int_enums: serialize_enums(types.int_enums),
      unions: serialize_unions(types.unions)
    }
  end

  defp serialize_primitives(primitives) do
    primitives
    |> Enum.map(fn {name, opts} ->
      encoded_type =
        opts
        |> option_value(:encoded_type)
        |> serialize_named_type()

      {to_string(name), %{encoded_type: encoded_type}}
    end)
    |> Enum.sort_by(fn {name, _} -> name end)
    |> Enum.into(%{})
  end

  defp serialize_objects(objects) do
    objects
    |> Enum.map(fn {name, object_spec} ->
      fields =
        object_spec
        |> option_value(:fields, [])
        |> Enum.map(&serialize_field/1)

      {to_string(name), %{fields: fields}}
    end)
    |> Enum.sort_by(fn {name, _} -> name end)
    |> Enum.into(%{})
  end

  defp serialize_enums(enums) do
    enums
    |> Enum.map(fn {name, values} ->
      serialized_values = Enum.map(values, &serialize_enum_value/1)
      {to_string(name), serialized_values}
    end)
    |> Enum.sort_by(fn {name, _} -> name end)
    |> Enum.into(%{})
  end

  defp serialize_unions(unions) do
    unions
    |> Enum.map(fn {name, type_refs} ->
      serialized_refs = Enum.map(type_refs, &serialize_type_ref/1)
      {to_string(name), serialized_refs}
    end)
    |> Enum.sort_by(fn {name, _} -> name end)
    |> Enum.into(%{})
  end

  defp serialize_namespace_descriptions(descriptions) do
    descriptions
    |> Enum.map(fn {namespace, desc} ->
      {to_string(namespace), desc}
    end)
    |> Enum.sort_by(fn {namespace, _} -> namespace end)
    |> Enum.into(%{})
  end

  defp serialize_endpoint(endpoint) do
    payload = %{
      full_name: endpoint.full_name,
      namespace: serialize_namespace(endpoint.namespace),
      name: endpoint.name,
      type: to_string(endpoint.type),
      method: endpoint.method,
      path: endpoint.path,
      handler: endpoint.handler,
      inputs: Enum.map(endpoint.inputs, &serialize_field/1),
      outputs: Enum.map(endpoint.outputs, &serialize_field/1),
      docstring: endpoint.docstring
    }

    if Map.get(endpoint, :hidden, false) do
      Map.put(payload, :hidden, true)
    else
      payload
    end
  end

  defp serialize_field({name, type, opts}) do
    has_default = option_has_key?(opts, :default)

    %{
      name: to_string(name),
      type: serialize_type_ref(type),
      optional: option_value(opts, :optional, false),
      has_default: has_default,
      nullable: option_value(opts, :null, false),
      default: if(has_default, do: serialize_literal(option_value(opts, :default)), else: nil)
    }
  end

  defp serialize_type_ref({:list, item}) do
    %{
      item: serialize_type_ref(item),
      kind: "list"
    }
  end

  defp serialize_type_ref(type) do
    %{
      name: serialize_named_type(type),
      kind: "named"
    }
  end

  defp serialize_named_type(nil), do: nil
  defp serialize_named_type(type) when is_atom(type), do: Atom.to_string(type)
  defp serialize_named_type(type) when is_binary(type), do: type
  defp serialize_named_type(type), do: to_string(type)

  defp serialize_namespace(nil), do: nil
  defp serialize_namespace(namespace) when is_atom(namespace), do: Atom.to_string(namespace)
  defp serialize_namespace(namespace) when is_binary(namespace), do: namespace
  defp serialize_namespace(namespace), do: to_string(namespace)

  defp serialize_enum_value(value) when is_binary(value), do: value
  defp serialize_enum_value(value) when is_atom(value), do: Atom.to_string(value)
  defp serialize_enum_value(value), do: to_string(value)

  defp serialize_literal(nil), do: nil

  defp serialize_literal(%Date{} = value), do: Date.to_iso8601(value)
  defp serialize_literal(%Time{} = value), do: Time.to_iso8601(value)
  defp serialize_literal(%NaiveDateTime{} = value), do: NaiveDateTime.to_iso8601(value)
  defp serialize_literal(%DateTime{} = value), do: DateTime.to_iso8601(value)

  defp serialize_literal(%{} = value) do
    value
    |> Enum.map(fn {key, nested_value} -> {serialize_map_key(key), serialize_literal(nested_value)} end)
    |> Enum.sort_by(fn {key, _} -> key end)
    |> Enum.into(%{})
  end

  defp serialize_literal(value) when is_list(value), do: Enum.map(value, &serialize_literal/1)
  defp serialize_literal(value) when is_binary(value), do: value
  defp serialize_literal(value) when is_atom(value), do: Atom.to_string(value)
  defp serialize_literal(value) when is_integer(value), do: value
  defp serialize_literal(value) when is_float(value), do: value
  defp serialize_literal(value), do: inspect(value)

  defp serialize_map_key(key) when is_binary(key), do: key
  defp serialize_map_key(key) when is_atom(key), do: Atom.to_string(key)
  defp serialize_map_key(key), do: to_string(key)

  defp option_value(opts, key, default \\ nil)
  defp option_value(opts, key, default) when is_list(opts), do: Keyword.get(opts, key, default)
  defp option_value(opts, key, default) when is_map(opts), do: Map.get(opts, key, default)
  defp option_value(_opts, _key, default), do: default

  defp option_has_key?(opts, key)
  defp option_has_key?(opts, key) when is_list(opts), do: Keyword.has_key?(opts, key)
  defp option_has_key?(opts, key) when is_map(opts), do: Map.has_key?(opts, key)
  defp option_has_key?(_opts, _key), do: false
end

defmodule Operately.ApiDocs.Catalog do
  @moduledoc false

  @schema_version 1

  def payload(catalog, api_base_path) do
    %{
      schema_version: @schema_version,
      api_base_path: api_base_path,
      generated_at: generated_at(),
      endpoint_count: length(catalog.endpoints),
      query_count: length(catalog.queries),
      mutation_count: length(catalog.mutations),
      types: serialize_types(catalog.types),
      endpoints: Enum.map(catalog.endpoints, &serialize_endpoint/1)
    }
  end

  def encode(payload) do
    Jason.encode!(payload, pretty: true)
  end

  defp generated_at do
    DateTime.utc_now()
    |> DateTime.truncate(:second)
    |> DateTime.to_iso8601()
  end

  defp serialize_types(types) do
    %{
      primitives: serialize_primitives(types.primitives),
      objects: serialize_objects(types.objects),
      enums: serialize_enums(types.enums),
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
    |> Enum.into(%{})
  end

  defp serialize_enums(enums) do
    enums
    |> Enum.map(fn {name, values} ->
      serialized_values = Enum.map(values, &serialize_enum_value/1)
      {to_string(name), serialized_values}
    end)
    |> Enum.into(%{})
  end

  defp serialize_unions(unions) do
    unions
    |> Enum.map(fn {name, type_refs} ->
      serialized_refs = Enum.map(type_refs, &serialize_type_ref/1)
      {to_string(name), serialized_refs}
    end)
    |> Enum.into(%{})
  end

  defp serialize_endpoint(endpoint) do
    %{
      full_name: endpoint.full_name,
      namespace: serialize_namespace(endpoint.namespace),
      name: endpoint.name,
      type: to_string(endpoint.type),
      method: endpoint.method,
      path: endpoint.path,
      handler: endpoint.handler,
      inputs: Enum.map(endpoint.inputs, &serialize_field/1),
      outputs: Enum.map(endpoint.outputs, &serialize_field/1)
    }
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

defmodule OperatelyWeb.Api.Serializer do
  @valid_levels [:essential, :full]

  def serialize(data) do
    serialize(data, level: :essential)
  end

  def serialize(data, level: level) do
    validate_level(level)

    data
    |> OperatelyWeb.Api.Serializable.serialize(level: level)
    |> maybe_put_typename(data)
  end

  defp maybe_put_typename(result, %mod{}) when is_map(result) do
    case OperatelyWeb.Api.TypeNames.for_module(mod) do
      nil -> result
      name -> Map.put(result, :__typename, name)
    end
  end

  defp maybe_put_typename(result, _original), do: result

  defp validate_level(level) do
    if !Enum.member?(@valid_levels, level) do
      raise ArgumentError, "Invalid level: #{inspect(level)}"
    end
  end
end

defprotocol OperatelyWeb.Api.Serializable do
  @doc """
  Defines the serialization protocol for the Operately API, which
  converts models to JSON-serializable data structures.

  Implementation for a given model should define a `serialize/2`
  function that takes the model and an options map, and returns
  a JSON-serializable data structure.

  The implmentations should be placed in the `OperatelyWeb.Api.Serializers`
  """

  @fallback_to_any true
  def serialize(data, opts)
end

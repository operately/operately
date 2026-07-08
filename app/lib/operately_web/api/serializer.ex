defmodule OperatelyWeb.Api.Serializer do
  @valid_levels [:essential, :full]

  def serialize(data, opts \\ [level: :essential])

  def serialize(data, opts) when is_list(opts) do
    level = Keyword.fetch!(opts, :level)
    validate_level(level)
    OperatelyWeb.Api.Serializable.serialize(data, opts)
  end

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

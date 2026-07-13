defmodule OperatelyWeb.Api.TypeNames do
  @moduledoc """
  Resolves and injects `__typename` for API payloads.

  Typenames come from `TurboConnect.TypeNames.resolve/1` (module override or
  derivation). Only modules registered via `object ..., for:` are injected by
  the serializer.
  """

  @type_modules [OperatelyWeb.Api.Types]

  def resolve(mod) when is_atom(mod), do: TurboConnect.TypeNames.resolve(mod)

  def default_name_for_module(mod), do: TurboConnect.TypeNames.default_name_for_module(mod)

  def for_module(mod) when is_atom(mod) do
    if registered?(mod), do: resolve(mod), else: nil
  end

  def registered?(mod) when is_atom(mod) do
    Map.has_key?(registered_modules(), mod)
  end

  def registered_modules do
    Enum.reduce(@type_modules, %{}, fn type_module, acc ->
      Map.merge(acc, type_module.__object_modules__())
    end)
  end

  def mapping, do: registered_modules()

  def tag(name, map) when is_binary(name) and is_map(map) do
    Map.put(map, :__typename, name)
  end

  def tag_module(mod, map) when is_atom(mod) and is_map(map) do
    tag(resolve(mod), map)
  end
end

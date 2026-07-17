defmodule Operately.Search.SourceRegistry do
  @moduledoc """
  Maps configured search source types to the adapter modules that handle them.

  Backfill and reconciliation jobs identify a source by its stable type instead of a
  module name. The registry resolves that type to a configured adapter and rejects
  duplicate types or modules that do not implement the `Operately.Search.Source`
  callbacks. This keeps adapter selection controlled by application configuration.
  """

  @callback_functions [source_type: 0, fetch_batch: 2, fetch_by_ids: 1, to_entry: 1]

  def configured do
    :operately
    |> Application.get_env(__MODULE__, [])
    |> build()
  end

  def build(source_modules) when is_list(source_modules) do
    Enum.reduce_while(source_modules, {:ok, %{}}, &register_source/2)
  end

  def fetch(registry, source_type) when is_map(registry) and is_binary(source_type) do
    case Map.fetch(registry, source_type) do
      {:ok, source_module} -> {:ok, source_module}
      :error -> {:error, :unknown_source_type}
    end
  end

  def fetch(source_type) when is_binary(source_type) do
    with {:ok, registry} <- configured() do
      fetch(registry, source_type)
    end
  end

  def source_types do
    with {:ok, registry} <- configured() do
      {:ok, Map.keys(registry) |> Enum.sort()}
    end
  end

  defp register_source(source_module, {:ok, registry}) do
    with :ok <- validate_source_module(source_module),
         source_type when is_binary(source_type) and source_type != "" <- source_module.source_type(),
         false <- Map.has_key?(registry, source_type) do
      {:cont, {:ok, Map.put(registry, source_type, source_module)}}
    else
      true -> {:halt, {:error, {:duplicate_source_type, source_module.source_type()}}}
      _ -> {:halt, {:error, {:invalid_source_module, source_module}}}
    end
  end

  defp validate_source_module(source_module) when is_atom(source_module) do
    if Code.ensure_loaded?(source_module) and Enum.all?(@callback_functions, fn {name, arity} -> function_exported?(source_module, name, arity) end) do
      :ok
    else
      {:error, :invalid_source_module}
    end
  end

  defp validate_source_module(_), do: {:error, :invalid_source_module}
end

defmodule Operately.CompanyTransfers.Schema.AppSchemas do
  @moduledoc """
  Looks up current application Ecto schemas so company transfer code can inspect table-backed field metadata.
  """

  @table_schema_map_key {__MODULE__, :table_schema_map, 2}

  @doc """
  Returns the persisted DB column names for `:map` fields on the current Ecto schema for the given table.
  """
  def map_fields_for_table(table_name) when is_binary(table_name) do
    case schema_for_table(table_name) do
      nil ->
        []

      module ->
        module.__schema__(:fields)
        |> Enum.filter(&(module.__schema__(:type, &1) == :map))
        |> Enum.map(&module.__schema__(:field_source, &1))
        |> Enum.reject(&is_nil/1)
        |> Enum.map(&to_string/1)
        |> Enum.sort()
    end
  end

  @doc """
  Returns the current application schema module for a DB table.
  """
  def schema_for_table(table_name) when is_binary(table_name) do
    Map.get(table_schema_map(), table_name)
  end

  @doc """
  Returns a DB column name to Ecto field atom map for persisted fields on the table schema.
  """
  def persisted_fields_for_table(table_name) when is_binary(table_name) do
    case schema_for_table(table_name) do
      nil -> %{}
      module -> persisted_fields(module)
    end
  end

  defp table_schema_map do
    case :persistent_term.get(@table_schema_map_key, nil) do
      nil ->
        map = build_table_schema_map()
        :persistent_term.put(@table_schema_map_key, map)
        map

      map ->
        map
    end
  end

  defp build_table_schema_map do
    operately_modules()
    |> Enum.filter(&schema_module?/1)
    |> Map.new(fn module -> {schema_table(module), module} end)
  end

  defp persisted_fields(module) do
    (module.__schema__(:fields) ++ module.__schema__(:embeds))
    |> Enum.reject(&(&1 in module.__schema__(:virtual_fields)))
    |> Map.new(fn field -> {module.__schema__(:field_source, field) |> to_string(), field} end)
  end

  defp operately_modules do
    case :application.get_key(:operately, :modules) do
      {:ok, modules} -> modules
      :undefined -> []
    end
  end

  defp schema_module?(module) do
    Code.ensure_loaded?(module) and function_exported?(module, :__schema__, 1) and current_app_schema?(module) and internal_app_schema_namespace?(module)
  end

  defp current_app_schema?(module) do
    table = schema_table(module)
    table != nil and table != "my_schema"
  end

  defp internal_app_schema_namespace?(module) do
    module_name = Atom.to_string(module)

    String.starts_with?(module_name, ["Elixir.Operately.", "Elixir.OperatelyEE."]) and
      not String.starts_with?(module_name, "Elixir.Operately.Data.")
  end

  defp schema_table(module) do
    module.__schema__(:source)
  rescue
    _error -> nil
  end
end

defmodule Operately.CompanyTransfers.Schema.AppSchemas do
  @moduledoc """
  Looks up current application Ecto schemas so company transfer code can inspect table-backed field metadata.
  """

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

  defp schema_for_table(table_name) when is_binary(table_name) do
    operately_modules()
    |> Enum.filter(&schema_module?/1)
    |> Enum.find(&(&1.__schema__(:source) == table_name))
  end

  defp operately_modules do
    case :application.get_key(:operately, :modules) do
      {:ok, modules} -> modules
      :undefined -> []
    end
  end

  defp schema_module?(module) do
    Code.ensure_loaded?(module) and function_exported?(module, :__schema__, 1) and schema_source_path?(module) and current_app_schema?(module)
  end

  defp schema_source_path?(module) do
    source = source_path(module)

    source != nil and
      (String.contains?(source, "/app/lib/") or String.contains?(source, "/app/ee/lib/")) and
      not String.contains?(source, "/app/lib/operately/data/")
  end

  defp current_app_schema?(module) do
    table = module.__schema__(:source)
    table != nil and table != "my_schema"
  end

  defp source_path(module) do
    case module.module_info(:compile)[:source] do
      source when is_list(source) -> List.to_string(source)
      source when is_binary(source) -> source
      _ -> nil
    end
  end
end

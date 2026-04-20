defmodule Operately.CompanyTransfers.Import.PolymorphicReferenceTranslator do
  @moduledoc """
  Rewrites row-level polymorphic type/id references using the transfer translation plan.
  """

  alias Operately.CompanyTransfers.Import.TranslationPlan
  alias Operately.CompanyTransfers.Schema.PolicyRegistry

  def translate_row(row, table, %TranslationPlan{} = plan) when is_map(row) and is_binary(table) do
    case PolicyRegistry.get_polymorphic_config(table) do
      nil ->
        {:ok, row}

      config ->
        translate_polymorphic_reference(row, table, config, plan)
    end
  end

  defp translate_polymorphic_reference(row, table, config, %TranslationPlan{} = plan) do
    case {Map.get(row, config.type_column), Map.get(row, config.id_column)} do
      {type_value, source_id} when is_binary(type_value) and is_binary(source_id) ->
        with {:ok, referenced_table} <- find_referenced_table(config, table, type_value),
             {:ok, translated_id} <- translate_referenced_id(plan, table, config, referenced_table, source_id) do
          {:ok, Map.put(row, config.id_column, translated_id)}
        end

      _ ->
        {:ok, row}
    end
  end

  defp find_referenced_table(config, table, type_value) do
    case Map.get(config.table_map, type_value) do
      nil -> {:error, {:unsupported_polymorphic_type, table, config.type_column, type_value}}
      referenced_table -> {:ok, referenced_table}
    end
  end

  defp translate_referenced_id(%TranslationPlan{} = plan, table, config, referenced_table, source_id) do
    case TranslationPlan.translate(plan, referenced_table, source_id) do
      nil -> {:skip, {:missing_polymorphic_reference, table, config.id_column, referenced_table, source_id}}
      translated_id -> {:ok, translated_id}
    end
  end
end

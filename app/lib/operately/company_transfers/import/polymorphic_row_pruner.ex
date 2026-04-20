defmodule Operately.CompanyTransfers.Import.PolymorphicRowPruner do
  @moduledoc """
  Removes polymorphic rows whose parents are not present in the imported package.

  This pruning happens before the translation plan is built so downstream polymorphic
  rows do not keep translations for rows that will never be inserted.
  """

  alias Operately.CompanyTransfers.Import.Package
  alias Operately.CompanyTransfers.Schema.PolicyRegistry

  @prune_order ["updates", "comment_threads", "comments", "reactions"]

  def prune(%Package{} = package) do
    initial_rows = Map.new(package.tables, &{&1["name"], Map.get(&1, "rows", [])})

    pruned_rows =
      Enum.reduce(@prune_order, initial_rows, fn table, rows_by_table ->
        rows = Map.get(rows_by_table, table, [])
        rows = Enum.filter(rows, &keep_row?(&1, table, rows_by_table))
        Map.put(rows_by_table, table, rows)
      end)

    tables =
      Enum.map(package.tables, fn table ->
        rows = Map.get(pruned_rows, table["name"], [])

        table
        |> Map.put("rows", rows)
        |> Map.put("row_count", length(rows))
      end)

    rows_count = Enum.reduce(tables, 0, fn table, acc -> acc + table["row_count"] end)
    tables_count = Enum.count(tables, &(&1["row_count"] > 0))

    %Package{
      package
      | tables: tables,
        table_map: Map.new(tables, &{&1["name"], &1}),
        manifest:
          package.manifest
          |> Map.put("rows_count", rows_count)
          |> Map.put("tables_count", tables_count)
    }
  end

  # Keeps polymorphic rows only if their referenced parent exists in rows_by_table.
  # Example: A comment with entity_id="goal-123" and entity_type="goal" is dropped
  # if "goal-123" is not present in the goals table.
  defp keep_row?(row, table, rows_by_table) do
    case PolicyRegistry.get_polymorphic_config(table) do
      nil ->
        true

      config ->
        case {Map.get(row, config.type_column), Map.get(row, config.id_column)} do
          {type_value, source_id} when is_binary(type_value) and is_binary(source_id) ->
            case Map.get(config.table_map, type_value) do
              nil ->
                true

              referenced_table ->
                source_id in source_ids(rows_by_table, referenced_table)
            end

          _ ->
            true
        end
    end
  end

  defp source_ids(rows_by_table, table) do
    rows_by_table
    |> Map.get(table, [])
    |> Enum.map(& &1["id"])
    |> Enum.filter(&is_binary/1)
  end
end

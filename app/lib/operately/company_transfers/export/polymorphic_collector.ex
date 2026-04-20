defmodule Operately.CompanyTransfers.Export.PolymorphicCollector do
  @moduledoc """
  Collects rows from polymorphic tables whose parents are already part of the package.

  The collector walks the known polymorphic tables in dependency order so later tables
  can reference rows collected earlier in the same pass.
  """

  alias Operately.CompanyTransfers.Export.Relational.{SchemaSnapshot, Sql}
  alias Operately.CompanyTransfers.Schema.PolicyRegistry

  @collection_order ["updates", "comment_threads", "comments", "reactions"]

  @doc """
  Collects polymorphic table rows that reference entities in the base dataset.

  Receives a schema snapshot and a map of base rows where each key is a table name (string)
  and each value is a list of row maps with string keys (e.g., `%{"id" => "uuid", ...}`).

  Walks polymorphic tables in dependency order, collecting rows that reference base rows
  or previously collected rows. Returns a map of collected polymorphic rows by table name
  in the same shape as base_rows.
  """
  def collect(%SchemaSnapshot{columns: columns}, base_rows) when is_map(base_rows) do
    {collected_rows, _all_rows} =
      Enum.reduce(@collection_order, {%{}, base_rows}, fn table, {collected_rows, all_rows} ->
        rows = collect_table_rows(table, all_rows, Map.fetch!(columns, table))

        {
          Map.put(collected_rows, table, rows),
          Map.put(all_rows, table, rows)
        }
      end)

    collected_rows
  end

  defp collect_table_rows(table, all_rows, columns) do
    config = PolicyRegistry.get_polymorphic_config(table)

    config.table_map
    |> Enum.flat_map(fn {type_value, referenced_table} ->
      source_ids = source_ids(all_rows, referenced_table)
      Sql.fetch_rows_by_type_and_ids!(table, config.type_column, type_value, config.id_column, source_ids, columns)
    end)
    |> Enum.uniq_by(& &1["id"])
  end

  defp source_ids(all_rows, table) do
    all_rows
    |> Map.get(table, [])
    |> Enum.map(& &1["id"])
    |> Enum.filter(&is_binary/1)
  end
end

defmodule Operately.CompanyTransfers.Export.Relational.PackageTables do
  alias Operately.CompanyTransfers.Export.Relational.SchemaSnapshot
  alias Operately.CompanyTransfers.Export.RowSerializer
  alias Operately.CompanyTransfers.Schema.TopologicalSort

  def build(%SchemaSnapshot{} = schema, included_rows, dependency_rows, custom_rows \\ %{})
      when is_map(included_rows) and is_map(dependency_rows) and is_map(custom_rows) do
    included_tables = SchemaSnapshot.included_tables(schema)
    extra_tables = Map.keys(dependency_rows) ++ Map.keys(custom_rows)
    selected_tables = Enum.uniq(included_tables ++ extra_tables)
    ordered_tables = sort_tables(selected_tables, schema.foreign_keys)
    row_map =
      included_tables
      |> Map.new(&{&1, Map.get(included_rows, &1, [])})
      |> Map.merge(dependency_rows)
      |> Map.merge(custom_rows)

    tables =
      Enum.map(ordered_tables, fn table ->
        rows = Map.get(row_map, table, [])
        columns = Map.fetch!(schema.columns, table)
        column_types = Map.new(columns, &{&1.name, &1.type})

        %{
          "name" => table,
          "classification" => Atom.to_string(schema.classifications[table]),
          "row_count" => length(rows),
          "rows" => Enum.map(rows, &RowSerializer.serialize_row(&1, column_types))
        }
      end)

    %{
      tables: tables,
      rows_count: Enum.reduce(tables, 0, fn table, acc -> acc + table["row_count"] end),
      non_empty_tables_count: Enum.count(tables, &(&1["row_count"] > 0))
    }
  end

  defp sort_tables(selected_tables, foreign_keys) do
    filtered_graph =
      Enum.reduce(selected_tables, %{}, fn table, acc ->
        deps =
          foreign_keys
          |> Map.get(table, [])
          |> Enum.map(& &1.references_table)
          |> Enum.filter(&(&1 in selected_tables and &1 != table))
          |> Enum.uniq()

        Map.put(acc, table, deps)
      end)

    {:ok, ordered_tables} = TopologicalSort.sort(filtered_graph)
    Enum.filter(ordered_tables, &(&1 in selected_tables))
  end
end

defmodule Operately.CompanyTransfers.Import.PackageOrder do
  @moduledoc """
  Reorders imported package tables into a safe insert order for the relational importer.

  Export order is based on the full foreign-key graph, but import only needs hard ordering
  for references that must already exist at insert time. Most nullable and self-referencing
  foreign keys are excluded because `RelationalImporter` restores them in a deferred-update pass.
  Task board owner references must be ordered even though they are individually nullable:
  the ownership check constraint requires one owner at insertion.
  """

  alias Operately.CompanyTransfers.Export.Relational.SchemaSnapshot
  alias Operately.CompanyTransfers.Import.Package
  alias Operately.CompanyTransfers.Schema.TopologicalSort

  @doc """
  Returns a copy of the package with tables reordered for insert-time foreign-key safety.

  Non-nullable foreign keys and task board owners contribute to the ordering graph.
  Other nullable references are deferred, breaking cycles such as `projects.last_check_in_id -> project_check_ins` and
  `project_check_ins.project_id -> projects` on the nullable side, which lets the importer
  insert rows first and then backfill the nullable reference later.
  """
  def reorder_for_insert(%Package{} = package, %SchemaSnapshot{} = schema) do
    selected_tables = Enum.map(package.tables, & &1["name"])

    dependency_graph =
      Enum.reduce(selected_tables, %{}, fn table, acc ->
        dependencies =
          schema.foreign_keys
          |> Map.get(table, [])
          |> Enum.filter(fn fk -> include_ordering_dependency?(schema, selected_tables, table, fk) end)
          |> Enum.map(& &1.references_table)
          |> Enum.uniq()

        Map.put(acc, table, dependencies)
      end)

    {:ok, ordered_table_names} = TopologicalSort.sort(dependency_graph)

    ordered_tables =
      ordered_table_names
      |> Enum.filter(&(&1 in selected_tables))
      |> Enum.map(&Package.table(package, &1))

    %Package{
      package
      | tables: ordered_tables,
        table_map: Map.new(ordered_tables, &{&1["name"], &1})
    }
  end

  defp include_ordering_dependency?(%SchemaSnapshot{} = schema, selected_tables, table, fk) do
    fk.references_table in selected_tables and
      fk.references_table != table and
      (board_owner_reference?(table, fk) or not nullable_column?(schema, table, fk.column))
  end

  defp board_owner_reference?("task_boards", %{column: column}) when column in ["space_id", "project_id"], do: true
  defp board_owner_reference?(_table, _fk), do: false

  defp nullable_column?(%SchemaSnapshot{} = schema, table, column) do
    schema.columns
    |> Map.get(table, [])
    |> Enum.find(&(&1.name == column))
    |> case do
      nil -> false
      column_info -> column_info.nullable
    end
  end
end

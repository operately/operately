defmodule Operately.CompanyTransfers.Import.ResourceFileNameNormalizer do
  @moduledoc """
  Normalizes resource file names before importing legacy company packages.

  Older exports could leave `resource_files.name` blank while storing the file's
  display name on the related `resource_nodes` row. This module preserves existing
  nonblank file names, restores missing names from their related nodes, and uses
  `"Untitled"` when neither row contains a usable name.
  """

  alias Operately.CompanyTransfers.Import.Package

  @untitled_file_name "Untitled"

  def normalize(%Package{} = package) do
    node_names_by_id = index_node_names(package)

    tables =
      Enum.map(package.tables, fn
        %{"name" => "resource_files"} = table -> normalize_file_names(table, node_names_by_id)
        table -> table
      end)

    %Package{package | tables: tables, table_map: Map.new(tables, &{&1["name"], &1})}
  end

  defp index_node_names(%Package{} = package) do
    package
    |> Package.table_rows("resource_nodes")
    |> Map.new(fn node -> {node["id"], node["name"]} end)
  end

  defp normalize_file_names(table, node_names_by_id) do
    rows = Enum.map(Map.get(table, "rows", []), &normalize_file_name(&1, node_names_by_id))
    Map.put(table, "rows", rows)
  end

  defp normalize_file_name(row, node_names_by_id) do
    legacy_node_name = Map.get(node_names_by_id, row["node_id"])

    cond do
      present_name?(row["name"]) -> row
      present_name?(legacy_node_name) -> Map.put(row, "name", legacy_node_name)
      true -> Map.put(row, "name", @untitled_file_name)
    end
  end

  defp present_name?(name) when is_binary(name), do: String.trim(name) != ""
  defp present_name?(_), do: false
end

defmodule Operately.CompanyTransfers.Import.ResourceFileNameNormalizerTest do
  use ExUnit.Case, async: true

  alias Operately.CompanyTransfers.Import.{Package, ResourceFileNameNormalizer}

  test "uses the related legacy resource node name when the file name is blank" do
    package =
      package([
        table("resource_nodes", [%{"id" => "node-1", "name" => "Launch artwork"}]),
        table("resource_files", [%{"id" => "file-1", "node_id" => "node-1", "name" => nil}])
      ])

    normalized = ResourceFileNameNormalizer.normalize(package)

    assert [file] = Package.table_rows(normalized, "resource_files")
    assert file["name"] == "Launch artwork"
  end

  test "uses Untitled when neither the file nor its related node has a name" do
    package =
      package([
        table("resource_nodes", [%{"id" => "node-1", "name" => "  "}]),
        table("resource_files", [%{"id" => "file-1", "node_id" => "node-1", "name" => ""}])
      ])

    normalized = ResourceFileNameNormalizer.normalize(package)

    assert [file] = Package.table_rows(normalized, "resource_files")
    assert file["name"] == "Untitled"
  end

  test "uses Untitled when the related resource node is unavailable" do
    package =
      package([
        table("resource_nodes", []),
        table("resource_files", [%{"id" => "file-1", "node_id" => "missing-node", "name" => nil}])
      ])

    normalized = ResourceFileNameNormalizer.normalize(package)

    assert [file] = Package.table_rows(normalized, "resource_files")
    assert file["name"] == "Untitled"
  end

  test "preserves an existing nonblank file name" do
    package =
      package([
        table("resource_nodes", [%{"id" => "node-1", "name" => "Legacy node name"}]),
        table("resource_files", [%{"id" => "file-1", "node_id" => "node-1", "name" => "Current file name"}])
      ])

    normalized = ResourceFileNameNormalizer.normalize(package)

    assert [file] = Package.table_rows(normalized, "resource_files")
    assert file["name"] == "Current file name"
  end

  defp package(tables) do
    %Package{
      manifest: %{},
      tables: tables,
      table_map: Map.new(tables, &{&1["name"], &1}),
      files: []
    }
  end

  defp table(name, rows) do
    %{
      "name" => name,
      "rows" => rows
    }
  end
end

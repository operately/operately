defmodule Operately.CompanyTransfers.Import.PolymorphicRowPrunerTest do
  use ExUnit.Case, async: true

  alias Operately.CompanyTransfers.Import.{Package, PolymorphicRowPruner}

  test "prunes polymorphic rows whose parents are missing from the package" do
    package =
      package([
        table("projects", [%{"id" => "project-1"}]),
        table("comment_threads", [
          %{"id" => "thread-1", "parent_type" => "project", "parent_id" => "project-1"},
          %{"id" => "thread-2", "parent_type" => "activity", "parent_id" => "missing-activity"}
        ]),
        table("comments", [
          %{"id" => "comment-1", "entity_type" => "comment_thread", "entity_id" => "thread-2"},
          %{"id" => "comment-2", "entity_type" => "comment_thread", "entity_id" => "thread-1"}
        ]),
        table("reactions", [
          %{"id" => "reaction-1", "entity_type" => "comment", "entity_id" => "comment-1"},
          %{"id" => "reaction-2", "entity_type" => "comment", "entity_id" => "comment-2"}
        ])
      ])

    package = PolymorphicRowPruner.prune(package)

    assert row_ids(package, "comment_threads") == ["thread-1"]
    assert row_ids(package, "comments") == ["comment-2"]
    assert row_ids(package, "reactions") == ["reaction-2"]
    assert package.manifest["rows_count"] == 4
    assert package.manifest["tables_count"] == 4
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
    %{"name" => name, "rows" => rows, "row_count" => length(rows), "columns" => []}
  end

  defp row_ids(package, table_name) do
    package
    |> Package.table_rows(table_name)
    |> Enum.map(& &1["id"])
  end
end

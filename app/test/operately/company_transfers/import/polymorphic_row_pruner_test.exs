defmodule Operately.CompanyTransfers.Import.PolymorphicRowPrunerTest do
  use ExUnit.Case, async: true

  alias Operately.CompanyTransfers.Import.{Package, PolymorphicRowPruner}

  test "prunes polymorphic rows whose parents are missing from the package" do
    package =
      package([
        table("projects", [%{"id" => "project-1"}]),
        table("updates", [
          %{"id" => "update-1", "updatable_type" => "project", "updatable_id" => "project-1"},
          %{"id" => "update-2", "updatable_type" => "project", "updatable_id" => "missing-project"}
        ]),
        table("comment_threads", [
          %{"id" => "thread-1", "parent_type" => "project", "parent_id" => "project-1"},
          %{"id" => "thread-2", "parent_type" => "activity", "parent_id" => "missing-activity"}
        ]),
        table("comments", [
          %{"id" => "comment-1", "entity_type" => "update", "entity_id" => "update-1"},
          %{"id" => "comment-2", "entity_type" => "comment_thread", "entity_id" => "thread-2"}
        ]),
        table("reactions", [
          %{"id" => "reaction-1", "entity_type" => "comment", "entity_id" => "comment-1"},
          %{"id" => "reaction-2", "entity_type" => "comment", "entity_id" => "comment-2"}
        ])
      ])

    package = PolymorphicRowPruner.prune(package)

    assert row_ids(package, "updates") == ["update-1"]
    assert row_ids(package, "comment_threads") == ["thread-1"]
    assert row_ids(package, "comments") == ["comment-1"]
    assert row_ids(package, "reactions") == ["reaction-1"]
    assert package.manifest["rows_count"] == 5
    assert package.manifest["tables_count"] == 5
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

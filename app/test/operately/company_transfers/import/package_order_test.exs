defmodule Operately.CompanyTransfers.Import.PackageOrderTest do
  use ExUnit.Case, async: true

  alias Operately.CompanyTransfers.Export.Relational.SchemaSnapshot
  alias Operately.CompanyTransfers.Import.{Package, PackageOrder}

  test "orders tables using only non-nullable foreign keys" do
    package =
      package([
        table("project_check_ins"),
        table("projects"),
        table("companies"),
        table("groups"),
        table("resource_hubs")
      ])

    schema =
      schema_snapshot(
        %{
          "companies" => [
            column("id", "uuid", false),
            column("company_space_id", "uuid", true)
          ],
          "groups" => [
            column("id", "uuid", false),
            column("company_id", "uuid", false),
            column("default_resource_hub_id", "uuid", true)
          ],
          "resource_hubs" => [
            column("id", "uuid", false),
            column("space_id", "uuid", true)
          ],
          "projects" => [
            column("id", "uuid", false),
            column("last_check_in_id", "uuid", true)
          ],
          "project_check_ins" => [
            column("id", "uuid", false),
            column("project_id", "uuid", false)
          ]
        },
        %{
          "companies" => [fk("company_space_id", "groups")],
          "groups" => [fk("company_id", "companies"), fk("default_resource_hub_id", "resource_hubs")],
          "resource_hubs" => [fk("space_id", "groups")],
          "projects" => [fk("last_check_in_id", "project_check_ins")],
          "project_check_ins" => [fk("project_id", "projects")]
        }
      )

    ordered = PackageOrder.reorder_for_insert(package, schema)

    assert Enum.map(ordered.tables, & &1["name"]) == [
             "companies",
             "groups",
             "projects",
             "project_check_ins",
             "resource_hubs"
           ]
  end

  test "preserves table entries and rebuilds the table map in reordered form" do
    accounts = table("accounts", [%{"id" => "a1"}])
    people = table("people", [%{"id" => "p1"}])

    package = package([people, accounts])

    schema =
      schema_snapshot(
        %{
          "accounts" => [column("id", "uuid", false)],
          "people" => [
            column("id", "uuid", false),
            column("account_id", "uuid", false)
          ]
        },
        %{
          "accounts" => [],
          "people" => [fk("account_id", "accounts")]
        }
      )

    ordered = PackageOrder.reorder_for_insert(package, schema)

    assert Enum.map(ordered.tables, & &1["name"]) == ["accounts", "people"]
    assert Package.table(ordered, "accounts") == accounts
    assert Package.table(ordered, "people") == people
  end

  defp package(tables) do
    %Package{
      manifest: %{},
      tables: tables,
      table_map: Map.new(tables, &{&1["name"], &1}),
      files: []
    }
  end

  defp table(name, rows \\ []) do
    %{
      "name" => name,
      "rows" => rows
    }
  end

  defp schema_snapshot(columns, foreign_keys) do
    %SchemaSnapshot{
      tables: Map.keys(columns),
      columns: columns,
      foreign_keys: foreign_keys,
      reverse_foreign_keys: %{},
      classifications: %{}
    }
  end

  defp column(name, type, nullable) do
    %{name: name, type: type, nullable: nullable, default: nil}
  end

  defp fk(column, references_table) do
    %{
      column: column,
      references_table: references_table,
      references_column: "id"
    }
  end
end

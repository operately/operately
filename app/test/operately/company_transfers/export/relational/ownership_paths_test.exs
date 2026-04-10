defmodule Operately.CompanyTransfers.Export.Relational.OwnershipPathsTest do
  use ExUnit.Case, async: true

  alias Operately.CompanyTransfers.Export.Relational.{OwnershipPaths, SchemaSnapshot}

  describe "find_paths_to_company/2" do
    test "returns the root path for the companies table" do
      schema =
        schema_snapshot(
          foreign_keys: %{"companies" => []},
          classifications: %{"companies" => :included}
        )

      assert OwnershipPaths.find_paths_to_company("companies", schema) == [[]]
    end

    test "returns a direct path when a table points straight to companies" do
      schema =
        schema_snapshot(
          foreign_keys: %{
            "projects" => [
              %{column: "company_id", references_table: "companies", references_column: "id"}
            ]
          },
          classifications: %{
            "companies" => :included,
            "projects" => :included
          }
        )

      assert OwnershipPaths.find_paths_to_company("projects", schema) == [
               [
                 %{
                   from_table: "projects",
                   to_table: "companies",
                   column: "company_id",
                   references_column: "id"
                 }
               ]
             ]
    end

    test "returns a multi-edge path through included parent tables" do
      schema =
        schema_snapshot(
          foreign_keys: %{
            "tasks" => [
              %{column: "project_id", references_table: "projects", references_column: "id"}
            ],
            "projects" => [
              %{column: "company_id", references_table: "companies", references_column: "id"}
            ]
          },
          classifications: %{
            "companies" => :included,
            "projects" => :included,
            "tasks" => :included
          }
        )

      assert OwnershipPaths.find_paths_to_company("tasks", schema) == [
               [
                 %{
                   from_table: "tasks",
                   to_table: "projects",
                   column: "project_id",
                   references_column: "id"
                 },
                 %{
                   from_table: "projects",
                   to_table: "companies",
                   column: "company_id",
                   references_column: "id"
                 }
               ]
             ]
    end

    test "skips non-included parents" do
      schema =
        schema_snapshot(
          foreign_keys: %{
            "people" => [
              %{column: "account_id", references_table: "accounts", references_column: "id"}
            ],
            "accounts" => [
              %{column: "home_company_id", references_table: "companies", references_column: "id"}
            ]
          },
          classifications: %{
            "accounts" => :dependency_parent,
            "companies" => :included,
            "people" => :included
          }
        )

      assert OwnershipPaths.find_paths_to_company("people", schema) == []
    end

    test "avoids cycles while still finding a valid company path" do
      schema =
        schema_snapshot(
          foreign_keys: %{
            "tasks" => [
              %{column: "project_id", references_table: "projects", references_column: "id"}
            ],
            "projects" => [
              %{column: "template_task_id", references_table: "tasks", references_column: "id"},
              %{column: "company_id", references_table: "companies", references_column: "id"}
            ]
          },
          classifications: %{
            "companies" => :included,
            "projects" => :included,
            "tasks" => :included
          }
        )

      assert OwnershipPaths.find_paths_to_company("tasks", schema) == [
               [
                 %{
                   from_table: "tasks",
                   to_table: "projects",
                   column: "project_id",
                   references_column: "id"
                 },
                 %{
                   from_table: "projects",
                   to_table: "companies",
                   column: "company_id",
                   references_column: "id"
                 }
               ]
             ]
    end

    test "deduplicates identical paths" do
      schema =
        schema_snapshot(
          foreign_keys: %{
            "projects" => [
              %{column: "company_id", references_table: "companies", references_column: "id"},
              %{column: "company_id", references_table: "companies", references_column: "id"}
            ]
          },
          classifications: %{
            "companies" => :included,
            "projects" => :included
          }
        )

      assert OwnershipPaths.find_paths_to_company("projects", schema) == [
               [
                 %{
                   from_table: "projects",
                   to_table: "companies",
                   column: "company_id",
                   references_column: "id"
                 }
               ]
             ]
    end
  end

  defp schema_snapshot(attrs) do
    struct(SchemaSnapshot, attrs)
  end
end

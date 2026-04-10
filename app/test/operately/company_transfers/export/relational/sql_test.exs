defmodule Operately.CompanyTransfers.Export.Relational.SqlTest do
  use Operately.DataCase

  alias Operately.CompanyTransfers.Package.Paths
  alias Operately.CompanyTransfers.Export.Relational.Sql

  setup do
    on_exit(fn -> File.rm_rf!(Paths.root()) end)
    {:ok, Factory.setup(%{})}
  end

  describe "ownership_path_query/2" do
    test "builds the ownership join query for a multi-edge path" do
      path = [
        %{from_table: "tasks", to_table: "projects", column: "project_id", references_column: "id"},
        %{from_table: "projects", to_table: "companies", column: "company_id", references_column: "id"}
      ]

      query = Sql.ownership_path_query("tasks", path)

      assert query ==
               "SELECT t0.* FROM \"tasks\" t0 " <>
                 "JOIN \"projects\" t1 ON t0.\"project_id\" = t1.\"id\" " <>
                 "JOIN \"companies\" t2 ON t1.\"company_id\" = t2.\"id\" " <>
                 "WHERE t2.\"id\" = $1"
    end

    test "raises when the table identifier is unsafe" do
      assert_raise ArgumentError, ~r/Unsafe SQL table/, fn ->
        Sql.ownership_path_query("tasks; DROP TABLE companies; --", [])
      end
    end

    test "raises when a path edge contains an unsafe table identifier" do
      path = [
        %{from_table: "tasks", to_table: "projects; DROP TABLE companies; --", column: "project_id", references_column: "id"}
      ]

      assert_raise ArgumentError, ~r/Unsafe SQL path.to_table/, fn ->
        Sql.ownership_path_query("tasks", path)
      end
    end

    test "raises when a path edge does not have the expected shape" do
      assert_raise ArgumentError, ~r/Invalid ownership path edge/, fn ->
        Sql.ownership_path_query("tasks", [%{to_table: "projects"}])
      end
    end
  end

  describe "fetch_rows_by_column!/4" do
    test "returns rows sorted by primary key rather than input order", ctx do
      other_ctx = Factory.setup(%{})
      input_ids = Enum.sort([ctx.company.id, other_ctx.company.id], :desc)

      rows =
        Sql.fetch_rows_by_column!(
          "companies",
          "id",
          input_ids,
          [%{name: "id", type: "uuid"}]
        )

      ids = Enum.map(rows, & &1["id"])

      assert ids == Enum.sort(ids)
      assert ids != input_ids
      assert Enum.sort(ids) == Enum.sort([ctx.company.id, other_ctx.company.id])
    end

    test "treats values as bound parameters instead of executable SQL", ctx do
      malicious_name = ctx.company.name <> "' OR 1=1 --"

      rows =
        Sql.fetch_rows_by_column!(
          "companies",
          "name",
          [malicious_name],
          [%{name: "id"}]
        )

      assert rows == []
    end

    test "raises when the table identifier is unsafe" do
      assert_raise ArgumentError, ~r/Unsafe SQL identifier/, fn ->
        Sql.fetch_rows_by_column!("companies; DROP TABLE people; --", "id", ["1"], [%{name: "id"}])
      end
    end

    test "raises when the column identifier is unsafe" do
      assert_raise ArgumentError, ~r/Unsafe SQL identifier/, fn ->
        Sql.fetch_rows_by_column!("companies", "id; DROP TABLE people; --", ["1"], [%{name: "id"}])
      end
    end

    test "returns an empty list when no values are provided" do
      assert Sql.fetch_rows_by_column!("companies", "id", [], [%{name: "id"}]) == []
    end
  end

  describe "result_rows/1" do
    test "converts SQL results into column-keyed maps" do
      result = %{
        columns: ["id", "name", "active"],
        rows: [
          ["1", "Acme", true],
          ["2", "Globex", false]
        ]
      }

      assert Sql.result_rows(result) == [
               %{"id" => "1", "name" => "Acme", "active" => true},
               %{"id" => "2", "name" => "Globex", "active" => false}
             ]
    end
  end
end

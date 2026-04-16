defmodule Operately.CompanyTransfers.Export.RelationalCollectorTest do
  use Operately.DataCase

  alias Operately.CompanyTransfers.Package.Paths
  alias Operately.CompanyTransfers.Export.RelationalCollector
  alias Operately.CompanyTransfers.Schema.PolicyRegistry

  setup do
    on_exit(fn -> File.rm_rf!(Paths.root()) end)
    {:ok, Factory.setup(%{})}
  end

  test "collects owned rows, dependency parents, metadata, and typed values without leaking another company", ctx do
    ctx =
      ctx
      |> Factory.add_space(:space)
      |> Factory.add_project(:project, :space)
      |> Factory.add_company_member(:member)

    ctx =
      ctx
      |> Factory.add_subscription(:subscription, :project, person: ctx.member)
      |> Factory.add_api_token(:raw_token, :creator)

    other_ctx =
      %{}
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.add_project(:project, :space)
      |> Factory.add_api_token(:raw_token, :creator)

    assert {:ok, collected} = RelationalCollector.collect(ctx.company.id)

    tables = table_map(collected)
    company_table = tables["companies"]

    assert company_table["classification"] == "included"
    assert tables["accounts"]["classification"] == "dependency_parent"
    assert tables["subscription_lists"]["classification"] == "dependency_parent"
    assert tables["subscriptions"]["classification"] == "dependency_parent"

    assert ctx.company.id in row_ids(tables, "companies")
    assert ctx.space.id in row_ids(tables, "groups")
    assert ctx.project.id in row_ids(tables, "projects")
    assert ctx.creator.id in row_ids(tables, "people")
    assert ctx.member.id in row_ids(tables, "people")
    assert ctx.account.id in row_ids(tables, "accounts")
    assert ctx.project.subscription_list_id in row_ids(tables, "subscription_lists")
    assert ctx.subscription.id in row_ids(tables, "subscriptions")

    refute other_ctx.company.id in row_ids(tables, "companies")
    refute other_ctx.space.id in row_ids(tables, "groups")
    refute other_ctx.project.id in row_ids(tables, "projects")
    refute other_ctx.creator.id in row_ids(tables, "people")
    refute other_ctx.account.id in row_ids(tables, "accounts")

    assert "id" in column_names(company_table)
    assert "name" in column_names(company_table)
    assert collected.rows_count == total_row_count(collected)
    assert collected.non_empty_tables_count == non_empty_table_count(collected)

    assert table_index(collected, "companies") < table_index(collected, "people")
    assert table_index(collected, "companies") < table_index(collected, "projects")
    assert table_index(collected, "accounts") < table_index(collected, "people")
    assert table_index(collected, "subscription_lists") < table_index(collected, "subscriptions")
  end

  test "collects dependency-parent children transitively from an owned project", ctx do
    ctx =
      ctx
      |> Factory.add_space(:space)
      |> Factory.add_project(:project, :space)
      |> Factory.add_company_member(:member)

    ctx =
      Factory.add_subscription(ctx, :subscription, :project, person: ctx.member, type: :mentioned)

    assert {:ok, collected} = RelationalCollector.collect(ctx.company.id)

    tables = table_map(collected)
    subscription_list = find_row(tables, "subscription_lists", ctx.project.subscription_list_id)
    subscription = find_row(tables, "subscriptions", ctx.subscription.id)

    assert subscription_list["id"] == ctx.project.subscription_list_id
    assert subscription["id"] == ctx.subscription.id
    assert subscription["subscription_list_id"] == ctx.project.subscription_list_id
    assert subscription["person_id"] == ctx.member.id
    assert subscription["type"] == "mentioned"
  end

  test "keeps empty included tables present in the minimal slice", ctx do
    assert {:ok, collected} = RelationalCollector.collect(ctx.company.id)

    tables = table_map(collected)
    empty_included_tables =
      tables
      |> Map.values()
      |> Enum.filter(&(&1["classification"] == "included" and &1["row_count"] == 0))

    # api_tokens is now excluded, so it should not appear in the export
    refute Map.has_key?(tables, "api_tokens")

    assert empty_included_tables != []
    assert Enum.all?(empty_included_tables, &(&1["rows"] == []))

    assert non_empty_table_count(collected) < length(collected.tables)
    assert collected.rows_count == total_row_count(collected)
  end

  defp table_map(collected) do
    Map.new(collected.tables, &{&1["name"], &1})
  end

  defp row_ids(tables, table_name) do
    tables
    |> Map.fetch!(table_name)
    |> Map.fetch!("rows")
    |> Enum.map(& &1["id"])
  end

  defp find_row(tables, table_name, row_id) do
    tables
    |> Map.fetch!(table_name)
    |> Map.fetch!("rows")
    |> Enum.find(&(&1["id"] == row_id))
  end

  defp column_names(table) do
    Enum.map(table["columns"], & &1["name"])
  end

  defp total_row_count(collected) do
    Enum.reduce(collected.tables, 0, fn table, acc -> acc + table["row_count"] end)
  end

  defp non_empty_table_count(collected) do
    Enum.count(collected.tables, &(&1["row_count"] > 0))
  end

  defp table_index(collected, table_name) do
    collected.tables
    |> Enum.map(& &1["name"])
    |> Enum.find_index(&(&1 == table_name))
  end
end

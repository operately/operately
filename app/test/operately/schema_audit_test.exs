defmodule Operately.SchemaAuditTest do
  use Operately.DataCase

  alias Operately.CompanyTransfers.Schema.Graph

  @ignored_tables [
    "schema_migrations",
    "oban_jobs",
    "oban_peers"
  ]

  describe "validate_table_coverage/0" do
    test "all non-framework database tables have a current Ecto schema" do
      assert validate_table_coverage() == {:ok, :schema_tables_match}
    end
  end

  describe "validate_column_coverage/0" do
    test "all legitimate database columns are mapped by the current Ecto schemas" do
      assert validate_column_coverage() == {:ok, :schema_columns_match}
    end
  end

  defp validate_table_coverage do
    db_tables_without_schema = db_tables_without_schema()
    schema_tables_without_db = schema_tables_without_db()

    if db_tables_without_schema == [] and schema_tables_without_db == [] do
      {:ok, :schema_tables_match}
    else
      {:error,
       %{
         db_tables_without_schema: db_tables_without_schema,
         schema_tables_without_db: schema_tables_without_db
       }}
    end
  end

  defp validate_column_coverage do
    case db_columns_without_schema_fields() do
      [] -> {:ok, :schema_columns_match}
      drift -> {:error, {:db_columns_without_schema_fields, drift}}
    end
  end

  defp db_tables_without_schema do
    schema_tables =
      app_schemas()
      |> Enum.map(& &1.table)
      |> MapSet.new()

    Graph.get_tables()
    |> Enum.reject(&(&1 in @ignored_tables))
    |> Enum.reject(&MapSet.member?(schema_tables, &1))
    |> Enum.sort()
  end

  defp schema_tables_without_db do
    db_tables = Graph.get_tables() |> MapSet.new()

    app_schemas()
    |> Enum.map(& &1.table)
    |> Enum.reject(&MapSet.member?(db_tables, &1))
    |> Enum.sort()
  end

  defp db_columns_without_schema_fields do
    app_schemas()
    |> Enum.map(fn schema ->
      db_columns =
        schema.table
        |> Graph.get_columns()
        |> Enum.map(&String.to_atom(&1.name))
        |> MapSet.new()

      extra_columns =
        db_columns
        |> MapSet.difference(schema.column_sources)
        |> MapSet.to_list()
        |> Enum.sort()

      %{table: schema.table, columns: extra_columns}
    end)
    |> Enum.reject(&Enum.empty?(&1.columns))
  end

  defp app_schemas do
    operately_modules()
    |> Enum.filter(&schema_module?/1)
    |> Enum.map(&schema_metadata/1)
    |> Enum.sort_by(& &1.table)
  end

  defp operately_modules do
    case :application.get_key(:operately, :modules) do
      {:ok, modules} -> modules
      :undefined -> []
    end
  end

  defp schema_module?(module) do
    Code.ensure_loaded?(module) and function_exported?(module, :__schema__, 1) and schema_source_path?(module) and current_app_schema?(module)
  end

  defp schema_source_path?(module) do
    source = source_path(module)

    source != nil and
      (String.contains?(source, "/app/lib/") or String.contains?(source, "/app/ee/lib/")) and
      not String.contains?(source, "/app/lib/operately/data/")
  end

  defp current_app_schema?(module) do
    table = module.__schema__(:source)
    table != nil and table != "my_schema"
  end

  defp schema_metadata(module) do
    %{
      module: module,
      source: source_path(module),
      table: module.__schema__(:source),
      column_sources:
        module.__schema__(:fields)
        |> Enum.map(&module.__schema__(:field_source, &1))
        |> Enum.reject(&is_nil/1)
        |> MapSet.new()
    }
  end

  defp source_path(module) do
    case module.module_info(:compile)[:source] do
      source when is_list(source) -> List.to_string(source)
      source when is_binary(source) -> source
      _ -> nil
    end
  end
end

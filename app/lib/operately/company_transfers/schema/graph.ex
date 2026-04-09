defmodule Operately.CompanyTransfers.Schema.Graph do
  @moduledoc """
  PostgreSQL schema introspection via `information_schema`.

  Queries the database to discover:
  - All tables in the `public` schema
  - Column definitions with types and nullability
  - Foreign key relationships with delete rules

  ## Key Functions

  - `get_tables/0` - List all tables
  - `get_columns/1` - Get columns for a table
  - `get_foreign_keys/1` - Get FK relationships for a table
  - `build_dependency_graph/0` - Build table dependency graph from FKs

  ## Why information_schema?

  Using PostgreSQL's `information_schema` instead of Ecto reflection provides:
  - **Completeness**: Captures all tables, even without Ecto schemas
  - **Accuracy**: Reflects actual DB state, not code definitions
  - **Flexibility**: Works with future schema changes automatically
  - **Type info**: Provides column types needed for serialization
  """

  alias Operately.Repo

  def load_schema do
    %{
      tables: get_tables(),
      columns: get_all_columns(),
      foreign_keys: get_all_foreign_keys()
    }
  end

  def get_tables do
    query = """
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
    ORDER BY table_name
    """

    case Ecto.Adapters.SQL.query(Repo, query, []) do
      {:ok, %{rows: rows}} -> Enum.map(rows, fn [table_name] -> table_name end)
      {:error, _} -> []
    end
  end

  def get_columns(table_name) when is_binary(table_name) do
    query = """
    SELECT
      column_name,
      data_type,
      is_nullable,
      column_default
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = $1
    ORDER BY ordinal_position
    """

    case Ecto.Adapters.SQL.query(Repo, query, [table_name]) do
      {:ok, %{rows: rows}} ->
        Enum.map(rows, fn [col_name, data_type, is_nullable, col_default] ->
          %{
            name: col_name,
            type: data_type,
            nullable: is_nullable == "YES",
            default: col_default
          }
        end)

      {:error, _} ->
        []
    end
  end

  def get_all_columns do
    tables = get_tables()

    Enum.reduce(tables, %{}, fn table, acc ->
      Map.put(acc, table, get_columns(table))
    end)
  end

  def get_foreign_keys(table_name) when is_binary(table_name) do
    query = """
    SELECT
      kcu.column_name,
      ccu.table_name AS foreign_table_name,
      ccu.column_name AS foreign_column_name,
      rc.delete_rule
    FROM information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
    JOIN information_schema.referential_constraints AS rc
      ON rc.constraint_name = tc.constraint_name
      AND rc.constraint_schema = tc.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_schema = 'public'
      AND tc.table_name = $1
    """

    case Ecto.Adapters.SQL.query(Repo, query, [table_name]) do
      {:ok, %{rows: rows}} ->
        Enum.map(rows, fn [col_name, foreign_table, foreign_col, delete_rule] ->
          %{
            column: col_name,
            references_table: foreign_table,
            references_column: foreign_col,
            on_delete: delete_rule
          }
        end)

      {:error, _} ->
        []
    end
  end

  def get_all_foreign_keys do
    tables = get_tables()

    Enum.reduce(tables, %{}, fn table, acc ->
      fks = get_foreign_keys(table)
      if fks == [], do: acc, else: Map.put(acc, table, fks)
    end)
  end

  def build_dependency_graph do
    foreign_keys = get_all_foreign_keys()

    Enum.reduce(foreign_keys, %{}, fn {table, fks}, acc ->
      dependencies =
        fks
        |> Enum.map(& &1.references_table)
        |> Enum.reject(&(&1 == table))
        |> Enum.uniq()

      if dependencies == [] do
        acc
      else
        Map.put(acc, table, dependencies)
      end
    end)
  end
end

defmodule Operately.CompanyTransfers.Schema.Discovery do
  @moduledoc """
  High-level API for schema introspection and table classification.

  Combines PostgreSQL schema discovery, explicit policy classification, and topological
  ordering to provide a complete picture of which tables to export and in what order.

  ## Overview

  This module is the main entry point for the schema graph system, which:
  - Discovers all database tables via `information_schema`
  - Classifies tables using explicit policy lists (no catch-all defaults)
  - Orders tables topologically to satisfy foreign key constraints
  - Provides metadata about columns, FKs, polymorphic patterns, and rich text

  ## Usage

      # Discover exportable tables in dependency order
      {:ok, tables} = Discovery.discover_exportable_tables()
      # => ["companies", "people", "accounts", "groups", "projects", ...]

      # Get complete metadata for a table
      metadata = Discovery.get_table_metadata("projects")
      # => %{
      #   name: "projects",
      #   columns: [...],
      #   foreign_keys: [...],
      #   classification: :included,
      #   polymorphic_config: nil,
      #   rich_text_columns: ["description"]
      # }

      # Validate all tables are classified (CI guard)
      {:ok, :all_tables_classified} = Discovery.validate_schema_coverage()

      # Get classification summary
      summary = Discovery.get_schema_summary()

  ## Table Classifications

  All tables must be explicitly classified in `PolicyRegistry`:

  - **`:excluded`** - System tables not exported (migrations, oban, sessions)
  - **`:polymorphic`** - Tables using type/id pattern (comments, reactions, updates)
  - **`:dependency_parent`** - Referenced but not company-owned (accounts, subscriptions)
  - **`:included`** - Normal company-owned tables to export (50+ tables)
  - **`:unclassified`** - Unknown tables (causes test failure)

  ## Safety Mechanism

  The `classify_table/1` function returns `:unclassified` for unknown tables instead of
  defaulting to `:included`. This means new tables added via migrations will cause
  `validate_schema_coverage/0` to fail until explicitly classified.

  ## Related Modules

  - `Graph` - PostgreSQL introspection via information_schema
  - `PolicyRegistry` - Explicit table classification lists
  - `TopologicalSort` - Dependency ordering with cycle breaking
  """

  alias Operately.CompanyTransfers.Schema.{Graph, PolicyRegistry, TopologicalSort}

  def discover_exportable_tables do
    all_tables = Graph.get_tables()

    included_tables =
      all_tables
      |> Enum.reject(&PolicyRegistry.excluded?/1)

    dependency_graph = Graph.build_dependency_graph()

    filtered_graph =
      dependency_graph
      |> Enum.filter(fn {table, _deps} -> table in included_tables end)
      |> Enum.into(%{})

    {:ok, sorted_tables} = TopologicalSort.sort(filtered_graph)
    exportable = Enum.filter(sorted_tables, &(&1 in included_tables))
    {:ok, exportable}
  end

  def get_table_metadata(table_name) when is_binary(table_name) do
    %{
      name: table_name,
      columns: Graph.get_columns(table_name),
      foreign_keys: Graph.get_foreign_keys(table_name),
      classification: classify_table(table_name),
      polymorphic_config: PolicyRegistry.get_polymorphic_config(table_name),
      rich_text_columns: PolicyRegistry.get_rich_text_columns(table_name)
    }
  end

  def classify_table(table_name) when is_binary(table_name) do
    cond do
      PolicyRegistry.excluded?(table_name) -> :excluded
      PolicyRegistry.polymorphic?(table_name) -> :polymorphic
      PolicyRegistry.dependency_parent?(table_name) -> :dependency_parent
      PolicyRegistry.included?(table_name) -> :included
      true -> :unclassified
    end
  end

  def validate_schema_coverage do
    all_tables = Graph.get_tables()

    unclassified =
      all_tables
      |> Enum.reject(fn table ->
        classification = classify_table(table)
        classification in [:excluded, :polymorphic, :dependency_parent, :included]
      end)

    if unclassified == [] do
      {:ok, :all_tables_classified}
    else
      {:error, {:unclassified_tables, unclassified}}
    end
  end

  def get_schema_summary do
    all_tables = Graph.get_tables()

    classified =
      all_tables
      |> Enum.group_by(&classify_table/1)

    %{
      total_tables: length(all_tables),
      excluded: length(Map.get(classified, :excluded, [])),
      polymorphic: length(Map.get(classified, :polymorphic, [])),
      dependency_parent: length(Map.get(classified, :dependency_parent, [])),
      included: length(Map.get(classified, :included, [])),
      tables_by_classification: classified
    }
  end
end

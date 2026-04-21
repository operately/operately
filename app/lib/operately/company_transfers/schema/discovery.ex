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
  - Provides metadata about columns, FKs, and type/id reference patterns

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
      #   type_id_reference_configs: []
      # }

      # Validate all tables are classified (CI guard)
      {:ok, :all_tables_classified} = Discovery.validate_schema_coverage()

      # Get classification summary
      summary = Discovery.get_schema_summary()

  ## Table Classifications

  All tables must be explicitly classified in `PolicyRegistry`:

  - **`:excluded`** - System tables not exported (migrations, oban, sessions)
  - **`:polymorphic`** - Tables using type/id pattern (comments, reactions, comment_threads)
  - **`:exception`** - Deferred special cases handled outside the minimal slice
  - **`:dependency_parent`** - Referenced but not company-owned (accounts, subscriptions)
  - **`:included`** - Normal company-owned tables to export (50+ tables)
  - **`:unclassified`** - Unknown tables (causes test failure)

  ## Safety Mechanism

  The `classify_table/1` function returns `:unclassified` for unknown tables instead of
  defaulting to `:included`. This means new tables added via migrations will cause
  `validate_schema_coverage/0` to fail until explicitly classified.

  ## Related Modules

  - `Graph` - PostgreSQL introspection via information_schema
  - `PolicyRegistry` - Explicit table classification and audited type/id reference lists
  - `TopologicalSort` - Dependency ordering with cycle breaking
  """

  alias Operately.CompanyTransfers.Schema.{Graph, PolicyRegistry, TopologicalSort}

  def discover_exportable_tables do
    all_tables = Graph.get_tables()

    exportable_tables =
      all_tables
      |> Enum.filter(fn table ->
        classification = classify_table(table)
        classification in [:included, :dependency_parent]
      end)

    dependency_graph = Graph.build_dependency_graph()

    filtered_graph =
      dependency_graph
      |> Enum.filter(fn {table, _deps} -> table in exportable_tables end)
      |> Enum.into(%{})

    {:ok, sorted_tables} = TopologicalSort.sort(filtered_graph)
    exportable = Enum.filter(sorted_tables, &(&1 in exportable_tables))
    {:ok, exportable}
  end

  def get_table_metadata(table_name) when is_binary(table_name) do
    %{
      name: table_name,
      columns: Graph.get_columns(table_name),
      foreign_keys: Graph.get_foreign_keys(table_name),
      classification: classify_table(table_name),
      polymorphic_config: PolicyRegistry.get_polymorphic_config(table_name),
      type_id_reference_configs: PolicyRegistry.get_type_id_reference_configs(table_name)
    }
  end

  def classify_table(table_name) when is_binary(table_name) do
    cond do
      PolicyRegistry.excluded?(table_name) -> :excluded
      PolicyRegistry.polymorphic?(table_name) -> :polymorphic
      PolicyRegistry.exception?(table_name) -> :exception
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
        classification in [:excluded, :polymorphic, :exception, :dependency_parent, :included]
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
      exception: length(Map.get(classified, :exception, [])),
      dependency_parent: length(Map.get(classified, :dependency_parent, [])),
      included: length(Map.get(classified, :included, [])),
      tables_by_classification: classified
    }
  end
end

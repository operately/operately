defmodule Operately.CompanyTransfers.SchemaGraphTest do
  use Operately.DataCase

  alias Operately.CompanyTransfers.Package.Paths
  alias Operately.CompanyTransfers.Schema.{Graph, PolicyRegistry, TopologicalSort, Discovery}

  setup do
    on_exit(fn -> File.rm_rf!(Paths.root()) end)
    :ok
  end

  describe "SchemaGraph.get_tables/0" do
    test "returns list of tables from information_schema" do
      tables = Graph.get_tables()

      assert is_list(tables)
      assert "companies" in tables
      assert "people" in tables
      assert "projects" in tables
      assert "goals" in tables
    end

    test "includes system tables" do
      tables = Graph.get_tables()

      assert "schema_migrations" in tables
      assert "oban_jobs" in tables
    end
  end

  describe "SchemaGraph.get_columns/1" do
    test "returns columns for companies table" do
      columns = Graph.get_columns("companies")

      assert is_list(columns)
      assert length(columns) > 0

      column_names = Enum.map(columns, & &1.name)
      assert "id" in column_names
      assert "name" in column_names
      assert "short_id" in column_names
      assert "inserted_at" in column_names
    end

    test "includes column metadata" do
      columns = Graph.get_columns("companies")
      id_column = Enum.find(columns, &(&1.name == "id"))

      assert id_column.type == "uuid"
      assert id_column.nullable == false
    end

    test "returns empty list for non-existent table" do
      columns = Graph.get_columns("non_existent_table")
      assert columns == []
    end
  end

  describe "SchemaGraph.get_foreign_keys/1" do
    test "returns foreign keys for projects table" do
      fks = Graph.get_foreign_keys("projects")

      assert is_list(fks)
      assert length(fks) > 0

      fk_columns = Enum.map(fks, & &1.column)
      assert "company_id" in fk_columns
      assert "creator_id" in fk_columns
      assert "group_id" in fk_columns
    end

    test "includes FK metadata" do
      fks = Graph.get_foreign_keys("projects")
      company_fk = Enum.find(fks, &(&1.column == "company_id"))

      assert company_fk.references_table == "companies"
      assert company_fk.references_column == "id"
      assert company_fk.on_delete in ["CASCADE", "NO ACTION", "SET NULL", "RESTRICT"]
    end

    test "returns FKs even for self-referencing tables" do
      fks = Graph.get_foreign_keys("companies")
      assert is_list(fks)
    end
  end

  describe "SchemaGraph.build_dependency_graph/0" do
    test "builds graph with table dependencies" do
      graph = Graph.build_dependency_graph()

      assert is_map(graph)
      assert Map.has_key?(graph, "projects")
      assert Map.has_key?(graph, "people")
    end

    test "projects depends on companies" do
      graph = Graph.build_dependency_graph()
      project_deps = Map.get(graph, "projects", [])

      assert "companies" in project_deps
    end

    test "people depends on companies" do
      graph = Graph.build_dependency_graph()
      people_deps = Map.get(graph, "people", [])

      assert "companies" in people_deps
    end

    test "excludes self-referencing dependencies" do
      graph = Graph.build_dependency_graph()
      goals_deps = Map.get(graph, "goals", [])

      refute "goals" in goals_deps
    end
  end

  describe "PolicyRegistry.excluded?/1" do
    test "returns true for system tables" do
      assert PolicyRegistry.excluded?("schema_migrations")
      assert PolicyRegistry.excluded?("oban_jobs")
      assert PolicyRegistry.excluded?("oban_peers")
    end

    test "returns true for transfer run tables" do
      assert PolicyRegistry.excluded?("company_export_runs")
      assert PolicyRegistry.excluded?("company_import_runs")
    end

    test "returns true for session/auth tables" do
      assert PolicyRegistry.excluded?("accounts_tokens")
      assert PolicyRegistry.excluded?("email_activation_codes")
    end

    test "returns false for company-owned tables" do
      refute PolicyRegistry.excluded?("companies")
      refute PolicyRegistry.excluded?("projects")
      refute PolicyRegistry.excluded?("goals")
    end
  end

  describe "PolicyRegistry.polymorphic?/1" do
    test "returns true for polymorphic tables" do
      assert PolicyRegistry.polymorphic?("updates")
      assert PolicyRegistry.polymorphic?("comments")
      assert PolicyRegistry.polymorphic?("reactions")
      assert PolicyRegistry.polymorphic?("comment_threads")
    end

    test "returns false for non-polymorphic tables" do
      refute PolicyRegistry.polymorphic?("companies")
      refute PolicyRegistry.polymorphic?("projects")
      refute PolicyRegistry.polymorphic?("activities")
      refute PolicyRegistry.polymorphic?("subscription_lists")
      refute PolicyRegistry.polymorphic?("notifications")
      refute PolicyRegistry.polymorphic?("access_contexts")
    end
  end

  describe "PolicyRegistry.get_polymorphic_config/1" do
    test "returns config for polymorphic tables" do
      config = PolicyRegistry.get_polymorphic_config("updates")

      assert config.type_column == "updatable_type"
      assert config.id_column == "updatable_id"
    end

    test "returns nil for non-polymorphic tables" do
      config = PolicyRegistry.get_polymorphic_config("companies")
      assert config == nil
    end
  end

  describe "PolicyRegistry.get_type_id_reference_configs/1" do
    test "returns config for polymorphic type/id tables" do
      [config] = PolicyRegistry.get_type_id_reference_configs("updates")

      assert config.type_column == "updatable_type"
      assert config.id_column == "updatable_id"
      assert config.reference_kind == :polymorphic
    end

    test "returns configs for non-polymorphic type/id tables" do
      configs = PolicyRegistry.get_type_id_reference_configs("activities")

      assert configs == [
               %{type_column: "resource_type", id_column: "resource_id", reference_kind: :typed_reference}
             ]
    end

    test "returns empty configs for tables without audited type/id references" do
      assert PolicyRegistry.get_type_id_reference_configs("notifications") == []
      assert PolicyRegistry.get_type_id_reference_configs("access_contexts") == []
    end
  end

  describe "PolicyRegistry.exception?/1" do
    test "returns true for deferred exception tables" do
      assert PolicyRegistry.exception?("activities")
      assert PolicyRegistry.exception?("notifications")
      assert PolicyRegistry.exception?("milestone_comments")
      assert PolicyRegistry.exception?("project_review_requests")
    end

    test "returns false for normal tables" do
      refute PolicyRegistry.exception?("companies")
      refute PolicyRegistry.exception?("projects")
    end
  end

  describe "PolicyRegistry.dependency_parent?/1" do
    test "returns true for dependency parent tables" do
      assert PolicyRegistry.dependency_parent?("accounts")
      assert PolicyRegistry.dependency_parent?("subscription_lists")
    end

    test "returns false for company-owned tables" do
      refute PolicyRegistry.dependency_parent?("companies")
      refute PolicyRegistry.dependency_parent?("projects")
    end
  end

  describe "PolicyRegistry.has_rich_text?/2" do
    test "returns true for known rich text columns" do
      assert PolicyRegistry.has_rich_text?("projects", "description")
      assert PolicyRegistry.has_rich_text?("goals", "description")
      assert PolicyRegistry.has_rich_text?("messages", "body")
    end

    test "returns false for non-rich-text columns" do
      refute PolicyRegistry.has_rich_text?("projects", "name")
      refute PolicyRegistry.has_rich_text?("companies", "name")
    end

    test "returns false for unknown table" do
      refute PolicyRegistry.has_rich_text?("unknown_table", "description")
    end
  end

  describe "TopologicalSort.sort/1" do
    test "sorts simple dependency graph" do
      graph = %{
        "a" => [],
        "b" => ["a"],
        "c" => ["b"]
      }

      assert {:ok, sorted} = TopologicalSort.sort(graph)
      assert sorted == ["a", "b", "c"]
    end

    test "handles multiple dependencies" do
      graph = %{
        "a" => [],
        "b" => [],
        "c" => ["a", "b"]
      }

      assert {:ok, sorted} = TopologicalSort.sort(graph)
      assert Enum.find_index(sorted, &(&1 == "a")) < Enum.find_index(sorted, &(&1 == "c"))
      assert Enum.find_index(sorted, &(&1 == "b")) < Enum.find_index(sorted, &(&1 == "c"))
    end

    test "handles diamond dependencies" do
      graph = %{
        "a" => [],
        "b" => ["a"],
        "c" => ["a"],
        "d" => ["b", "c"]
      }

      assert {:ok, sorted} = TopologicalSort.sort(graph)
      assert Enum.find_index(sorted, &(&1 == "a")) < Enum.find_index(sorted, &(&1 == "b"))
      assert Enum.find_index(sorted, &(&1 == "a")) < Enum.find_index(sorted, &(&1 == "c"))
      assert Enum.find_index(sorted, &(&1 == "b")) < Enum.find_index(sorted, &(&1 == "d"))
      assert Enum.find_index(sorted, &(&1 == "c")) < Enum.find_index(sorted, &(&1 == "d"))
    end

    test "sorts real schema with companies before people" do
      graph = Graph.build_dependency_graph()

      assert {:ok, sorted} = TopologicalSort.sort(graph)

      if "companies" in sorted and "people" in sorted do
        companies_idx = Enum.find_index(sorted, &(&1 == "companies"))
        people_idx = Enum.find_index(sorted, &(&1 == "people"))
        assert companies_idx < people_idx
      end
    end

    test "sorts real schema with people before projects" do
      graph = Graph.build_dependency_graph()

      assert {:ok, sorted} = TopologicalSort.sort(graph)

      if "people" in sorted and "projects" in sorted do
        people_idx = Enum.find_index(sorted, &(&1 == "people"))
        projects_idx = Enum.find_index(sorted, &(&1 == "projects"))
        assert people_idx < projects_idx
      end
    end
  end

  describe "TopologicalSort.validate_acyclic/1" do
    test "returns ok for acyclic graph" do
      graph = %{
        "a" => [],
        "b" => ["a"],
        "c" => ["b"]
      }

      assert {:ok, :no_cycles} = TopologicalSort.validate_acyclic(graph)
    end

    test "returns ok with cycle info for real schema" do
      graph = Graph.build_dependency_graph()
      assert {:ok, _} = TopologicalSort.validate_acyclic(graph)
    end
  end

  describe "SchemaDiscovery.discover_exportable_tables/0" do
    test "returns ordered list of exportable tables" do
      assert {:ok, tables} = Discovery.discover_exportable_tables()

      assert is_list(tables)
      assert "companies" in tables
      assert "projects" in tables
      assert "goals" in tables
      refute "comment_threads" in tables
      refute "activities" in tables
      refute "notifications" in tables
      refute "milestone_comments" in tables
      refute "project_review_requests" in tables
    end

    test "excludes system tables" do
      assert {:ok, tables} = Discovery.discover_exportable_tables()

      refute "schema_migrations" in tables
      refute "oban_jobs" in tables
      refute "company_export_runs" in tables
    end

    test "maintains topological order" do
      assert {:ok, tables} = Discovery.discover_exportable_tables()

      if "companies" in tables and "people" in tables do
        companies_idx = Enum.find_index(tables, &(&1 == "companies"))
        people_idx = Enum.find_index(tables, &(&1 == "people"))
        assert companies_idx < people_idx
      end
    end
  end

  describe "SchemaDiscovery.get_table_metadata/1" do
    test "returns complete metadata for a table" do
      metadata = Discovery.get_table_metadata("projects")

      assert metadata.name == "projects"
      assert is_list(metadata.columns)
      assert is_list(metadata.foreign_keys)
      assert metadata.classification in [:included, :excluded, :polymorphic, :exception, :dependency_parent]
    end

    test "includes polymorphic config for polymorphic tables" do
      metadata = Discovery.get_table_metadata("updates")

      assert metadata.classification == :polymorphic
      assert metadata.polymorphic_config.type_column == "updatable_type"

      assert metadata.type_id_reference_configs == [
               %{type_column: "updatable_type", id_column: "updatable_id", reference_kind: :polymorphic}
             ]
    end

    test "includes audited type/id reference config for non-polymorphic tables" do
      metadata = Discovery.get_table_metadata("activities")

      assert metadata.classification == :exception
      assert metadata.polymorphic_config == nil

      assert metadata.type_id_reference_configs == [
               %{type_column: "resource_type", id_column: "resource_id", reference_kind: :typed_reference}
             ]
    end

    test "includes rich text columns" do
      metadata = Discovery.get_table_metadata("projects")

      assert "description" in metadata.rich_text_columns
    end
  end

  describe "SchemaDiscovery.classify_table/1" do
    test "classifies excluded tables" do
      assert Discovery.classify_table("schema_migrations") == :excluded
      assert Discovery.classify_table("oban_jobs") == :excluded
    end

    test "classifies polymorphic tables" do
      assert Discovery.classify_table("updates") == :polymorphic
      assert Discovery.classify_table("comments") == :polymorphic
      assert Discovery.classify_table("comment_threads") == :polymorphic
    end

    test "classifies deferred exception tables" do
      assert Discovery.classify_table("activities") == :exception
      assert Discovery.classify_table("notifications") == :exception
      assert Discovery.classify_table("milestone_comments") == :exception
      assert Discovery.classify_table("project_review_requests") == :exception
    end

    test "classifies dependency parent tables" do
      assert Discovery.classify_table("accounts") == :dependency_parent
    end

    test "classifies normal tables as included" do
      assert Discovery.classify_table("companies") == :included
      assert Discovery.classify_table("projects") == :included
    end
  end

  describe "SchemaDiscovery.validate_schema_coverage/0" do
    test "validates all tables are classified" do
      result = Discovery.validate_schema_coverage()

      assert result == {:ok, :all_tables_classified}
    end

    test "keeps included tables closed under hard foreign keys for the minimal slice" do
      invalid_refs =
        PolicyRegistry.included_tables()
        |> Enum.flat_map(fn table ->
          Graph.get_foreign_keys(table)
          |> Enum.reject(fn fk ->
            classification = Discovery.classify_table(fk.references_table)
            classification in [:included, :dependency_parent]
          end)
          |> Enum.map(fn fk -> {table, fk.column, fk.references_table, Discovery.classify_table(fk.references_table)} end)
        end)

      assert invalid_refs == []
    end
  end

  describe "SchemaDiscovery.get_schema_summary/0" do
    test "returns summary of schema classification" do
      summary = Discovery.get_schema_summary()

      assert summary.total_tables > 0
      assert summary.excluded > 0
      assert summary.included > 0
      assert is_map(summary.tables_by_classification)
    end

    test "summary counts match table lists" do
      summary = Discovery.get_schema_summary()

      excluded_count = length(Map.get(summary.tables_by_classification, :excluded, []))
      exception_count = length(Map.get(summary.tables_by_classification, :exception, []))
      assert summary.excluded == excluded_count
      assert summary.exception == exception_count
    end
  end
end

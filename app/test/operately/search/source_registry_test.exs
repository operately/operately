defmodule Operately.Search.SourceRegistryTest do
  use ExUnit.Case, async: true

  alias Operately.Search.{IndexRun, SourceRegistry}

  defmodule ProjectSource do
    @behaviour Operately.Search.Source

    def source_type, do: "project"
    def fetch_batch(_cursor, _limit), do: {:ok, []}
    def fetch_by_ids(_ids), do: {:ok, []}
    def to_entry(_source), do: :skip
  end

  defmodule DuplicateProjectSource do
    @behaviour Operately.Search.Source

    def source_type, do: "project"
    def fetch_batch(_cursor, _limit), do: {:ok, []}
    def fetch_by_ids(_ids), do: {:ok, []}
    def to_entry(_source), do: :skip
  end

  test "maps stable source types to trusted modules" do
    assert {:ok, registry} = SourceRegistry.build([ProjectSource])
    assert {:ok, ProjectSource} = SourceRegistry.fetch(registry, "project")
    assert {:error, :unknown_source_type} = SourceRegistry.fetch(registry, "missing")
  end

  test "registers every production search source" do
    assert {:ok, source_types} = SourceRegistry.source_types()

    assert source_types == [
             "discussion",
             "goal",
             "goal_check_in",
             "milestone",
             "person",
             "project",
             "project_check_in",
             "project_retrospective",
             "resource_hub_document",
             "resource_hub_file",
             "resource_hub_folder",
             "resource_hub_link",
             "task"
           ]

    assert Enum.sort(IndexRun.source_types()) == Enum.map(source_types, &String.to_existing_atom/1)
  end

  test "rejects duplicate and invalid source registrations" do
    assert {:error, {:duplicate_source_type, "project"}} = SourceRegistry.build([ProjectSource, DuplicateProjectSource])
    assert {:error, {:invalid_source_module, String}} = SourceRegistry.build([String])
  end
end

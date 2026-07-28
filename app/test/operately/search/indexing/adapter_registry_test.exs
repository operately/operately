defmodule Operately.Search.Indexing.AdapterRegistryTest do
  use ExUnit.Case, async: true

  alias Operately.Search.Indexing.AdapterRegistry

  defmodule ProjectSource do
    @behaviour Operately.Search.Indexing.Adapter

    def source_type, do: "project"
    def fetch_batch(_cursor, _limit), do: {:ok, []}
    def fetch_by_ids(_ids), do: {:ok, []}
    def to_entry(_source), do: :skip
  end

  defmodule DuplicateProjectSource do
    @behaviour Operately.Search.Indexing.Adapter

    def source_type, do: "project"
    def fetch_batch(_cursor, _limit), do: {:ok, []}
    def fetch_by_ids(_ids), do: {:ok, []}
    def to_entry(_source), do: :skip
  end

  test "maps stable source types to trusted modules" do
    assert {:ok, registry} = AdapterRegistry.build([ProjectSource])
    assert {:ok, ProjectSource} = AdapterRegistry.fetch(registry, "project")
    assert {:error, :unknown_source_type} = AdapterRegistry.fetch(registry, "missing")
  end

  test "rejects duplicate and invalid source registrations" do
    assert {:error, {:duplicate_source_type, "project"}} = AdapterRegistry.build([ProjectSource, DuplicateProjectSource])
    assert {:error, {:invalid_source_module, String}} = AdapterRegistry.build([String])
  end
end

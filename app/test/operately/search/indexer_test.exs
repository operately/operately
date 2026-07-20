defmodule Operately.Search.IndexerTest do
  use Operately.DataCase, async: true

  alias Ecto.Multi
  alias Operately.Access
  alias Operately.Search.Entry
  alias Operately.Search.Indexer
  alias Operately.Support.Factory

  setup do
    Factory.setup(%{})
    |> Factory.add_space(:space)
    |> Factory.add_project(:project, :space)
  end

  test "upserts normalized searchable entries and preserves their identity", ctx do
    attrs = entry_attrs(ctx, title: "  Ｃａｆé   Launch  ")

    assert {:ok, %{inserted: 1, updated: 0, unchanged: 0, invalid: 0, invalid_entries: []}} = Indexer.upsert(attrs)

    first = Repo.get_by!(Entry, source_type: :project, source_id: ctx.project.id)
    assert first.source_type == :project
    assert first.title == "  Ｃａｆé   Launch  "
    assert first.normalized_title == "cafe launch"

    assert {:ok, %{inserted: 0, updated: 1, unchanged: 0, invalid: 0, invalid_entries: []}} =
             Indexer.upsert(%{attrs | title: "Launch plan", body: "Updated details"})

    second = Repo.get_by!(Entry, source_type: :project, source_id: ctx.project.id)
    assert second.id == first.id
    assert second.title == "Launch plan"
    assert second.body == "Updated details"
  end

  test "reports unchanged and invalid entries without discarding valid entries", ctx do
    attrs = entry_attrs(ctx)
    assert {:ok, _} = Indexer.upsert(attrs)

    invalid = Map.delete(attrs, :access_context_id) |> Map.put(:source_id, Ecto.UUID.generate())

    assert {:ok, %{inserted: 0, updated: 0, unchanged: 1, invalid: 1, invalid_entries: [error]}} =
             Indexer.upsert_all([attrs, invalid])

    assert error.source_id == invalid.source_id
    assert %{access_context_id: ["can't be blank"]} = errors_on(error.changeset)
  end

  test "guarded upserts do not replace newer entries with late maintenance snapshots", ctx do
    old_attrs = entry_attrs(ctx, title: "Old source snapshot")
    newer_attrs = entry_attrs(ctx, title: "New canonical value", source_updated_at: later_than(ctx.project.updated_at))

    assert {:ok, %{inserted: 1}} = Indexer.upsert(newer_attrs)
    assert {:ok, %{updated: 0, superseded: 1}} = Indexer.upsert_guarded(old_attrs)

    entry = Repo.get_by!(Entry, source_id: ctx.project.id)
    assert entry.title == "New canonical value"
    assert NaiveDateTime.compare(entry.source_updated_at, newer_attrs.source_updated_at) == :eq
  end

  test "guarded upserts keep an equal-version entry when indexed data differs", ctx do
    attrs = entry_attrs(ctx, title: "Canonical value")
    assert {:ok, %{inserted: 1}} = Indexer.upsert(attrs)

    assert {:ok, %{updated: 0, superseded: 1}} =
             Indexer.upsert_guarded(%{attrs | title: "Ambiguous maintenance value"})

    assert Repo.get_by!(Entry, source_id: ctx.project.id).title == "Canonical value"
  end

  test "guarded upserts accept newer source versions", ctx do
    attrs = entry_attrs(ctx, title: "Original")
    assert {:ok, %{inserted: 1}} = Indexer.upsert(attrs)

    newer_attrs = %{attrs | title: "Newer", source_updated_at: later_than(attrs.source_updated_at)}
    assert {:ok, %{updated: 1, superseded: 0}} = Indexer.upsert_guarded(newer_attrs)

    assert Repo.get_by!(Entry, source_id: ctx.project.id).title == "Newer"
  end

  test "locked repairs fix projection corruption with an equal source version", ctx do
    attrs = entry_attrs(ctx, title: "Canonical value")
    assert {:ok, %{inserted: 1}} = Indexer.upsert(%{attrs | title: "Stale projection"})

    assert {:ok, %{updated: 1, superseded: 0}} = Indexer.repair_locked(attrs)
    assert Repo.get_by!(Entry, source_id: ctx.project.id).title == "Canonical value"
  end

  test "requires a source update timestamp", ctx do
    attrs = entry_attrs(ctx) |> Map.delete(:source_updated_at)

    assert {:ok, %{invalid: 1, invalid_entries: [error]}} = Indexer.upsert(attrs)
    assert %{source_updated_at: ["can't be blank"]} = errors_on(error.changeset)
  end

  test "deletes entries directly and through an Ecto.Multi", ctx do
    assert {:ok, _} = Indexer.upsert(entry_attrs(ctx))
    assert {:ok, 1} = Indexer.delete("project", ctx.project.id)

    assert {:ok, _} = Indexer.upsert(entry_attrs(ctx))

    assert {:ok, %{search_entry: 1}} =
             Multi.new()
             |> Indexer.delete(:search_entry, "project", ctx.project.id)
             |> Repo.transaction()

    refute Repo.get_by(Entry, source_type: :project, source_id: ctx.project.id)
  end

  test "bulk operations participate in an Ecto.Multi", ctx do
    attrs = entry_attrs(ctx)

    assert {:ok, %{upsert: %{inserted: 1}, delete: 1}} =
             Multi.new()
             |> Indexer.upsert_all(:upsert, [attrs])
             |> Indexer.delete_many(:delete, [{attrs.source_type, attrs.source_id}])
             |> Repo.transaction()

    refute Repo.get_by(Entry, source_type: attrs.source_type, source_id: attrs.source_id)
  end

  test "uses an empty body when an adapter omits or clears it", ctx do
    attrs = entry_attrs(ctx) |> Map.delete(:body)

    assert {:ok, %{inserted: 1}} = Indexer.upsert(attrs)
    assert Repo.get_by!(Entry, source_id: attrs.source_id).body == ""

    assert {:ok, %{updated: 0, unchanged: 1}} = Indexer.upsert(Map.put(attrs, :body, nil))
  end

  test "casts persisted display states to atoms", ctx do
    attrs = entry_attrs(ctx, state: "closed")

    assert {:ok, %{inserted: 1}} = Indexer.upsert(attrs)
    assert Repo.get_by!(Entry, source_id: attrs.source_id).state == :closed

    invalid_attrs = %{attrs | source_id: Ecto.UUID.generate(), state: "unknown"}
    assert {:ok, %{invalid: 1, invalid_entries: [error]}} = Indexer.upsert(invalid_attrs)
    assert %{state: ["is invalid"]} = errors_on(error.changeset)
  end

  test "rejects source types outside the controlled vocabulary", ctx do
    attrs = entry_attrs(ctx, source_type: :unknown_source)

    assert {:ok, %{invalid: 1, invalid_entries: [error]}} = Indexer.upsert(attrs)
    assert %{source_type: ["is invalid"]} = errors_on(error.changeset)
    refute Repo.get_by(Entry, source_id: attrs.source_id)
  end

  test "Ecto.Multi upserts participate in the surrounding transaction", ctx do
    result =
      Multi.new()
      |> Indexer.upsert(:search_entry, entry_attrs(ctx))
      |> Multi.run(:forced_failure, fn _, _ -> {:error, :rollback} end)
      |> Repo.transaction()

    assert {:error, :forced_failure, :rollback, _changes} = result
    refute Repo.get_by(Entry, source_type: :project, source_id: ctx.project.id)
  end

  test "Ecto.Multi upserts can build entries from earlier results", ctx do
    attrs = entry_attrs(ctx)

    assert {:ok, %{search_entry: %{inserted: 1}}} =
             Multi.new()
             |> Multi.put(:source_attrs, attrs)
             |> Indexer.upsert(:search_entry, fn %{source_attrs: source_attrs} -> source_attrs end)
             |> Repo.transaction()

    assert Repo.get_by!(Entry, source_id: ctx.project.id).title == attrs.title
  end

  test "guarded Ecto.Multi upserts roll back with their transaction", ctx do
    result =
      Multi.new()
      |> Indexer.upsert_guarded(:search_entry, entry_attrs(ctx))
      |> Multi.run(:forced_failure, fn _, _ -> {:error, :rollback} end)
      |> Repo.transaction()

    assert {:error, :forced_failure, :rollback, _changes} = result
    refute Repo.get_by(Entry, source_type: :project, source_id: ctx.project.id)
  end

  defp entry_attrs(ctx, overrides \\ []) do
    context = Access.get_context(project_id: ctx.project.id)

    %{
      source_type: "project",
      source_id: ctx.project.id,
      company_id: ctx.company.id,
      access_context_id: context.id,
      space_id: ctx.space.id,
      project_id: ctx.project.id,
      title: "Project launch",
      body: "A searchable project description",
      body_kind: "description",
      source_inserted_at: ctx.project.inserted_at,
      source_updated_at: ctx.project.updated_at
    }
    |> Map.merge(Map.new(overrides))
  end

  defp later_than(timestamp), do: NaiveDateTime.add(timestamp, 1, :second)
end

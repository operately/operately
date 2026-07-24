defmodule Operately.Search.ResourceHubMaintenanceTest do
  use Operately.DataCase
  use Oban.Testing, repo: Operately.Repo

  alias Operately.Access
  alias Operately.Projects.Project
  alias Operately.ResourceHubs.{Link, Node}
  alias Operately.Search
  alias Operately.Search.{Entry, IndexRun, Indexer}
  alias Operately.Support.{Factory, RichText}

  @source_types [
    "resource_hub_folder",
    "resource_hub_document",
    "resource_hub_file",
    "resource_hub_link"
  ]

  setup ctx do
    previous_batch_size = Application.get_env(:operately, :search_index_batch_size, 500)
    Application.put_env(:operately, :search_index_batch_size, 1)
    on_exit(fn -> Application.put_env(:operately, :search_index_batch_size, previous_batch_size) end)

    ctx =
      ctx
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.add_resource_hub(:hub, :space, :creator)
      |> Factory.add_folder(:folder, :hub)
      |> Factory.add_document(:document, :hub, folder: :folder, name: "Search document", content: RichText.rich_text("Document content"))
      |> Factory.add_file(:resource_file, :hub, folder: :folder)
      |> Factory.add_link(:resource_link, :hub, folder: :folder)

    ctx
  end

  test "all registered adapters backfill in resumable batches and rerun idempotently", ctx do
    first_runs = start_and_drain_all(:backfill)

    assert Enum.all?(first_runs, &(&1.status == :completed))
    assert Enum.all?(first_runs, &(&1.processed_count > 0))

    assert_entry(:resource_hub_folder, ctx.folder.id)
    assert_entry(:resource_hub_document, ctx.document.id)
    assert_entry(:resource_hub_file, ctx.resource_file.id)
    assert_entry(:resource_hub_link, ctx.resource_link.id)

    second_runs = start_and_drain_all(:backfill)

    assert Enum.all?(second_runs, &(&1.status == :completed))
    assert Enum.sum(Enum.map(second_runs, & &1.unchanged_count)) == 4
    assert Repo.aggregate(Entry, :count) == 4
  end

  test "backfill updates resource hub scope after a project moves spaces", ctx do
    ctx =
      ctx
      |> Factory.add_space(:destination_space)
      |> Factory.add_project(:project, :space)
      |> Factory.add_resource_hub(:project_hub, :project, :creator)
      |> Factory.add_document(:project_document, :project_hub)

    first_run = start_and_drain(:backfill, "resource_hub_document")
    assert first_run.status == :completed

    original_entry = assert_entry(:resource_hub_document, ctx.project_document.id)
    assert original_entry.space_id == ctx.space.id
    moved_at = original_entry.source_updated_at |> NaiveDateTime.add(5, :second) |> NaiveDateTime.truncate(:second)

    ctx.project
    |> Project.changeset(%{group_id: ctx.destination_space.id})
    |> Ecto.Changeset.put_change(:updated_at, moved_at)
    |> Repo.update!()

    second_run = start_and_drain(:backfill, "resource_hub_document")
    assert second_run.status == :completed
    assert second_run.updated_count == 1

    updated_entry = assert_entry(:resource_hub_document, ctx.project_document.id)
    assert updated_entry.space_id == ctx.destination_space.id
    assert NaiveDateTime.compare(updated_entry.source_updated_at, moved_at) == :eq
  end

  test "reconciliation repairs stale entries, removes exclusions and orphans, and restores eligible records", ctx do
    start_and_drain_all(:backfill)

    document_entry = assert_entry(:resource_hub_document, ctx.document.id)

    document_entry
    |> Ecto.Changeset.change(title: "Stale title")
    |> Repo.update!()

    context = Access.get_context!(group_id: ctx.space.id)
    orphan_id = Ecto.UUID.generate()

    assert {:ok, _summary} =
             Indexer.upsert(%{
               source_type: "resource_hub_link",
               source_id: orphan_id,
               company_id: ctx.company.id,
               access_context_id: context.id,
               resource_hub_id: ctx.hub.id,
               space_id: ctx.space.id,
               title: "Orphan link",
               body: "No original record",
               body_kind: "description",
               source_updated_at: ctx.document.updated_at
             })

    Repo.soft_delete!(ctx.resource_link)

    reconciliation_runs = start_and_drain_all(:reconciliation)
    assert Enum.all?(reconciliation_runs, &(&1.status == :completed))

    repaired = assert_entry(:resource_hub_document, ctx.document.id)
    assert repaired.title == "Search document"
    refute_entry(:resource_hub_link, ctx.resource_link.id)
    refute_entry(:resource_hub_link, orphan_id)

    restored_link =
      Link
      |> Repo.get_by_id(ctx.resource_link.id, :with_deleted)
      |> Ecto.Changeset.change(deleted_at: nil)
      |> Repo.update!()

    assert restored_link.deleted_at == nil
    run = start_and_drain(:backfill, "resource_hub_link")
    assert run.status == :completed
    assert_entry(:resource_hub_link, restored_link.id)

    Repo.soft_delete!(ctx.folder)
    Repo.soft_delete!(Repo.get!(Node, ctx.folder.node_id))
    start_and_drain_all(:reconciliation)

    Enum.each(
      [
        {:resource_hub_folder, ctx.folder.id},
        {:resource_hub_document, ctx.document.id},
        {:resource_hub_file, ctx.resource_file.id},
        {:resource_hub_link, restored_link.id}
      ],
      fn {source_type, source_id} -> refute_entry(source_type, source_id) end
    )

    assert Repo.get_by(Link, id: restored_link.id)
  end

  defp start_and_drain_all(kind) do
    Oban.Testing.with_testing_mode(:manual, fn ->
      start_result =
        case kind do
          :backfill -> Search.start_backfill(:all)
          :reconciliation -> Search.start_reconciliation(:all)
        end

      assert {:ok, runs} = start_result
      assert Enum.sort(Enum.map(runs, &Atom.to_string(&1.source_type))) == Enum.sort(@source_types)
      assert %{failure: 0} = Oban.drain_queue(queue: :default, with_recursion: true)
      Enum.map(runs, &Repo.get!(IndexRun, &1.id))
    end)
  end

  defp start_and_drain(kind, source_type) do
    Oban.Testing.with_testing_mode(:manual, fn ->
      start_result =
        case kind do
          :backfill -> Search.start_backfill(source_type)
          :reconciliation -> Search.start_reconciliation(source_type)
        end

      assert {:ok, run} = start_result
      assert %{failure: 0} = Oban.drain_queue(queue: :default, with_recursion: true)
      Repo.get!(IndexRun, run.id)
    end)
  end

  defp assert_entry(source_type, source_id) do
    Repo.get_by!(Entry, source_type: source_type, source_id: source_id)
  end

  defp refute_entry(source_type, source_id) do
    refute Repo.get_by(Entry, source_type: source_type, source_id: source_id)
  end
end

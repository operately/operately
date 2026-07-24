defmodule Operately.Search.SourceIndexerTest do
  use Operately.DataCase
  use Oban.Testing, repo: Operately.Repo

  alias Ecto.Multi
  alias Operately.Access
  alias Operately.ResourceHubs.Folder
  alias Operately.Search.{Entry, ResourceHubIndex, SourceIndexer, SourceRegistry}
  alias Operately.Search.ResourceHubIndex.Worker
  alias Operately.Support.Factory

  defmodule InvalidFolderSource do
    @behaviour Operately.Search.Source

    @impl true
    def source_type, do: "resource_hub_folder"

    @impl true
    def fetch_batch(_cursor, _limit), do: {:ok, []}

    @impl true
    def fetch_by_ids(ids), do: {:ok, Enum.map(ids, &%{id: &1})}

    @impl true
    def to_entry(_record), do: {:error, {:invalid, :deliberate_test_error}}
  end

  defmodule PreparedFolderSource do
    @behaviour Operately.Search.Source

    @impl true
    def source_type, do: "resource_hub_folder"

    @impl true
    def fetch_batch(_cursor, _limit), do: {:ok, []}

    @impl true
    def fetch_by_ids(ids), do: {:ok, Enum.map(ids, &%{id: &1})}

    @impl true
    def to_entry(%{id: id}), do: {:ok, Process.get({__MODULE__, id})}
  end

  setup ctx do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> Factory.add_resource_hub(:hub, :space, :creator)
    |> Factory.add_folder(:parent_folder, :hub)
    |> Factory.add_folder(:folder, :hub, :parent_folder)
  end

  test "reloads the source and authoritatively synchronizes its entry", ctx do
    assert {:ok, %{inserted: 1, deleted: 0}} = SourceIndexer.sync("resource_hub_folder", ctx.folder.id)

    entry = Repo.get_by!(Entry, source_type: :resource_hub_folder, source_id: ctx.folder.id)
    assert entry.title == "folder"

    ctx.folder
    |> Folder.changeset(%{name: "Renamed folder"})
    |> Repo.update!()

    assert {:ok, %{updated: 1, deleted: 0}} = SourceIndexer.sync("resource_hub_folder", ctx.folder.id)
    assert Repo.get_by!(Entry, source_id: ctx.folder.id).title == "Renamed folder"
  end

  test "deletes entries for missing or excluded sources", ctx do
    assert {:ok, _summary} = SourceIndexer.sync("resource_hub_folder", ctx.folder.id)
    Repo.soft_delete!(ctx.folder)

    assert {:ok, %{deleted: 1}} = SourceIndexer.sync("resource_hub_folder", ctx.folder.id)
    refute Repo.get_by(Entry, source_id: ctx.folder.id)

    missing_id = Ecto.UUID.generate()
    assert {:ok, %{deleted: 0}} = SourceIndexer.sync("resource_hub_folder", missing_id)
  end

  test "canonical writes commit before a queued indexing failure is retried", ctx do
    previous_sources = Application.fetch_env(:operately, SourceRegistry)
    Application.put_env(:operately, SourceRegistry, [InvalidFolderSource])
    on_exit(fn -> restore_source_registry(previous_sources) end)

    Oban.Testing.with_testing_mode(:manual, fn ->
      assert {:ok, _changes} =
               Multi.new()
               |> Multi.update(:folder, Folder.changeset(ctx.folder, %{name: "Committed name"}))
               |> ResourceHubIndex.enqueue_resource(:search_folder, :folder, fn changes -> changes.folder.id end)
               |> Repo.transaction()

      assert Repo.reload!(ctx.folder).name == "Committed name"

      assert [job] = all_enqueued(worker: Worker)
      assert {:error, _reason} = perform_job(Worker, job.args)
    end)
  end

  test "the refresh job rolls back with its canonical transaction", ctx do
    Oban.Testing.with_testing_mode(:manual, fn ->
      assert {:error, :stop, :deliberate_rollback, _changes} =
               Multi.new()
               |> Multi.update(:folder, Folder.changeset(ctx.folder, %{name: "Must roll back"}))
               |> ResourceHubIndex.enqueue_resource(:search_folder, :folder, fn changes -> changes.folder.id end)
               |> Multi.run(:stop, fn _repo, _changes -> {:error, :deliberate_rollback} end)
               |> Repo.transaction()

      assert Repo.reload!(ctx.folder).name == "folder"
      refute_enqueued(worker: Worker)
    end)
  end

  test "validates the complete batch before writing any entry", ctx do
    previous_sources = Application.fetch_env(:operately, SourceRegistry)
    Application.put_env(:operately, SourceRegistry, [PreparedFolderSource])
    on_exit(fn -> restore_source_registry(previous_sources) end)

    valid_id = Ecto.UUID.generate()
    invalid_id = Ecto.UUID.generate()
    context = Access.get_context!(group_id: ctx.space.id)

    valid_attrs = %{
      company_id: ctx.company.id,
      access_context_id: context.id,
      resource_hub_id: ctx.hub.id,
      space_id: ctx.space.id,
      title: "Valid folder",
      source_updated_at: ctx.folder.updated_at
    }

    Process.put({PreparedFolderSource, valid_id}, valid_attrs)
    Process.put({PreparedFolderSource, invalid_id}, Map.delete(valid_attrs, :title))

    assert {:error, :invalid_search_entry} =
             SourceIndexer.sync_all("resource_hub_folder", [valid_id, invalid_id])

    refute Repo.get_by(Entry, source_id: valid_id)
    refute Repo.get_by(Entry, source_id: invalid_id)
  end

  defp restore_source_registry({:ok, source_modules}), do: Application.put_env(:operately, SourceRegistry, source_modules)
  defp restore_source_registry(:error), do: Application.delete_env(:operately, SourceRegistry)
end

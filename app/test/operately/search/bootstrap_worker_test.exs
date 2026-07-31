defmodule Operately.Search.BootstrapWorkerTest do
  use Operately.DataCase
  use Oban.Testing, repo: Operately.Repo

  alias Operately.Repo
  alias Operately.Search.{BootstrapWorker, IndexRun, MaintenanceWorker, SourceRegistry}

  defmodule ProjectSource do
    @behaviour Operately.Search.Source

    def source_type, do: "project"
    def fetch_batch(_cursor, _limit), do: {:ok, []}
    def fetch_by_ids(_ids), do: {:ok, []}
    def to_entry(_source), do: :skip
  end

  defmodule GoalSource do
    @behaviour Operately.Search.Source

    def source_type, do: "goal"
    def fetch_batch(_cursor, _limit), do: {:ok, []}
    def fetch_by_ids(_ids), do: {:ok, []}
    def to_entry(_source), do: :skip
  end

  setup do
    previous_sources = Application.fetch_env(:operately, SourceRegistry)
    Application.put_env(:operately, SourceRegistry, [ProjectSource])

    on_exit(fn -> restore_source_registry(previous_sources) end)
  end

  test "starts the first backfill for every registered source" do
    Oban.Testing.with_testing_mode(:manual, fn ->
      assert :ok = perform_job(BootstrapWorker, %{})

      assert [%IndexRun{source_type: :project, kind: :backfill, status: :pending}] = Repo.all(IndexRun)
      assert [job] = all_enqueued(worker: MaintenanceWorker)
      assert job.queue == "search_maintenance"
      assert job.args["source_type"] == "project"
    end)
  end

  test "does not automatically repeat a backfill after any recorded status" do
    for status <- [:pending, :running, :completed, :completed_with_errors, :failed] do
      Repo.delete_all(IndexRun)
      Repo.delete_all(Oban.Job)
      insert_run!(status)

      Oban.Testing.with_testing_mode(:manual, fn ->
        assert :ok = perform_job(BootstrapWorker, %{})
        assert Repo.aggregate(IndexRun, :count) == 1
        refute_enqueued(worker: MaintenanceWorker)
      end)
    end
  end

  test "repeated and concurrent bootstrap jobs do not create duplicate runs" do
    Oban.Testing.with_testing_mode(:manual, fn ->
      first = Oban.insert!(BootstrapWorker.new(%{}))
      second = Oban.insert!(BootstrapWorker.new(%{}))

      assert first.id == second.id
      assert second.conflict?

      assert :ok = perform_job(BootstrapWorker, %{})
      assert :ok = perform_job(BootstrapWorker, %{})
      assert Repo.aggregate(IndexRun, :count) == 1
    end)
  end

  test "treats a concurrently created active run as already started" do
    insert_run!(:running, :reconciliation)

    Oban.Testing.with_testing_mode(:manual, fn ->
      assert :ok = perform_job(BootstrapWorker, %{})
      assert Repo.aggregate(IndexRun, :count) == 1
      refute Repo.get_by(IndexRun, kind: :backfill)
    end)
  end

  test "a newly registered source receives its own first backfill" do
    Oban.Testing.with_testing_mode(:manual, fn ->
      assert :ok = perform_job(BootstrapWorker, %{})

      Application.put_env(:operately, SourceRegistry, [ProjectSource, GoalSource])
      assert :ok = perform_job(BootstrapWorker, %{})

      assert Repo.aggregate(IndexRun, :count) == 2
      assert Repo.get_by!(IndexRun, source_type: :project).kind == :backfill
      assert Repo.get_by!(IndexRun, source_type: :goal).kind == :backfill
    end)
  end

  test "uses the dedicated low-concurrency maintenance queue" do
    assert BootstrapWorker.new(%{}).changes.queue == "search_maintenance"
    assert MaintenanceWorker.new(%{}).changes.queue == "search_maintenance"

    assert Keyword.fetch!(Application.fetch_env!(:operately, Oban)[:queues], :search_maintenance) == 1
  end

  test "is scheduled once when the Oban cluster boots" do
    plugins = Application.fetch_env!(:operately, Oban)[:plugins]
    {Oban.Plugins.Cron, options} = Enum.find(plugins, fn {plugin, _options} -> plugin == Oban.Plugins.Cron end)

    assert {"@reboot", BootstrapWorker} in options[:crontab]
  end

  test "returns infrastructure failures so Oban can retry them" do
    Application.put_env(:operately, SourceRegistry, [String])

    assert {:error, {:invalid_source_module, String}} = perform_job(BootstrapWorker, %{})
  end

  defp insert_run!(status, kind \\ :backfill) do
    timestamps =
      if status in [:completed, :completed_with_errors, :failed] do
        %{completed_at: DateTime.utc_now()}
      else
        %{}
      end

    %{source_type: "project", kind: kind, status: status, phase: :source_scan}
    |> Map.merge(timestamps)
    |> IndexRun.changeset()
    |> Repo.insert!()
  end

  defp restore_source_registry({:ok, source_modules}), do: Application.put_env(:operately, SourceRegistry, source_modules)
  defp restore_source_registry(:error), do: Application.delete_env(:operately, SourceRegistry)
end

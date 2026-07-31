defmodule Operately.Search.MaintenanceRunsTest do
  use Operately.DataCase
  use Oban.Testing, repo: Operately.Repo

  alias Operately.Repo
  alias Operately.Search.{IndexRun, MaintenanceRuns, SourceRegistry}

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
    Application.put_env(:operately, SourceRegistry, [ProjectSource, GoalSource])

    on_exit(fn -> restore_source_registry(previous_sources) end)
  end

  test "lists every registered source with its latest maintenance run" do
    older = insert_terminal_run!("project", :backfill, :completed, ~U[2026-07-30 10:00:00Z])
    latest = insert_terminal_run!("project", :reconciliation, :completed_with_errors, ~U[2026-07-30 11:00:00Z])

    assert {:ok, statuses} = MaintenanceRuns.list_source_statuses()

    assert [%{source_type: "goal", latest_run: nil}, project] = statuses
    assert project.source_type == "project"
    assert project.latest_run.id == latest.id
    refute project.latest_run.id == older.id
  end

  test "starts all idle sources and reports sources that already have an active run" do
    insert_active_run!("project", :reconciliation)

    Oban.Testing.with_testing_mode(:manual, fn ->
      assert {:ok, result} = MaintenanceRuns.start(:backfill, :all)
      assert result.started_source_types == ["goal"]
      assert result.already_running_source_types == ["project"]
      assert Repo.get_by!(IndexRun, source_type: :goal).kind == :backfill
    end)
  end

  test "returns a conflict for a single source that already has an active run" do
    insert_active_run!("project", :backfill)

    assert {:error, :already_running} = MaintenanceRuns.start(:reconciliation, "project")
  end

  test "rejects unknown kinds and source types" do
    assert {:error, :unknown_maintenance_kind} = MaintenanceRuns.start(:repair, "project")
    assert {:error, :unknown_source_type} = MaintenanceRuns.start(:backfill, "missing")
  end

  defp insert_active_run!(source_type, kind) do
    %{source_type: source_type, kind: kind, status: :running, phase: :source_scan, started_at: DateTime.utc_now()}
    |> IndexRun.changeset()
    |> Repo.insert!()
  end

  defp insert_terminal_run!(source_type, kind, status, inserted_at) do
    completed_at = DateTime.add(inserted_at, 60, :second)
    inserted_at_naive = DateTime.to_naive(inserted_at)
    completed_at_naive = DateTime.to_naive(completed_at)

    %IndexRun{}
    |> IndexRun.changeset(%{
      source_type: source_type,
      kind: kind,
      status: status,
      phase: :source_scan,
      completed_at: completed_at
    })
    |> Ecto.Changeset.put_change(:inserted_at, inserted_at_naive)
    |> Ecto.Changeset.put_change(:updated_at, completed_at_naive)
    |> Repo.insert!()
  end

  defp restore_source_registry({:ok, source_modules}), do: Application.put_env(:operately, SourceRegistry, source_modules)
  defp restore_source_registry(:error), do: Application.delete_env(:operately, SourceRegistry)
end

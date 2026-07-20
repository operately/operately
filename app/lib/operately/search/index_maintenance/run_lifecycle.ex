defmodule Operately.Search.IndexMaintenance.RunLifecycle do
  @moduledoc """
  Manages durable progress for search-index maintenance runs.

  It locks and validates a run before processing, records batch counters and cursors,
  moves reconciliation from its source scan to its index scan, and either schedules
  the next batch or marks the run complete.

  These functions run inside the transaction opened by `IndexMaintenance`, keeping
  index changes, checkpoint changes, and the next Oban job atomic.
  """

  import Ecto.Query

  alias Operately.Repo
  alias Operately.Search.{ErrorCategory, IndexRun, MaintenanceWorker}
  alias Operately.Search.IndexMaintenance.BatchResult

  def claim(run_id, phase, cursor) do
    run = lock_run!(run_id)

    cond do
      terminal?(run) -> {:ignored, :terminal}
      stale_job?(run, phase, cursor) -> {:ignored, :stale}
      true -> {:ok, mark_running(run)}
    end
  end

  def record_batch(run, %BatchResult{} = result) do
    run = add_counts(run, result)

    cond do
      not result.exhausted? -> advance_cursor(run, result.cursor)
      run.kind == :reconciliation and run.phase == :source_scan -> start_index_scan(run)
      true -> complete_run(run)
    end
  end

  def mark_failed(%{"run_id" => run_id, "phase" => phase, "cursor" => cursor}, reason) do
    case Repo.transaction(fn ->
           case lock_run(run_id) do
             nil ->
               :ok

             run ->
               if terminal?(run) or stale_job?(run, phase, cursor) do
                 :ok
               else
                 fail_run(run, reason)
               end
           end
         end) do
      {:ok, :ok} -> :ok
      {:error, transaction_reason} -> {:error, transaction_reason}
    end
  end

  defp lock_run!(run_id) do
    from(run in IndexRun, where: run.id == ^run_id, lock: "FOR UPDATE")
    |> Repo.one!()
  end

  defp lock_run(run_id) do
    from(run in IndexRun, where: run.id == ^run_id, lock: "FOR UPDATE")
    |> Repo.one()
  end

  defp terminal?(run), do: run.status in [:completed, :completed_with_errors, :failed]

  defp stale_job?(run, phase, cursor) do
    not matching_phase?(run.phase, phase) or run.cursor != cursor
  end

  defp matching_phase?(:source_scan, phase), do: phase in ["source_scan", "sources"]
  defp matching_phase?(:index_scan, phase), do: phase in ["index_scan", "orphans"]

  defp mark_running(%{status: :running} = run), do: run

  defp mark_running(run) do
    run
    |> IndexRun.changeset(%{status: :running, started_at: DateTime.utc_now()})
    |> Repo.update!()
  end

  defp add_counts(run, result) do
    run
    |> IndexRun.changeset(%{
      processed_count: run.processed_count + result.processed,
      inserted_count: run.inserted_count + result.inserted,
      updated_count: run.updated_count + result.updated,
      unchanged_count: run.unchanged_count + result.unchanged,
      superseded_count: run.superseded_count + result.superseded,
      skipped_count: run.skipped_count + result.skipped,
      failed_count: run.failed_count + result.failed,
      deleted_orphan_count: run.deleted_orphan_count + result.deleted_orphans,
      last_error: result.last_error || run.last_error
    })
    |> Repo.update!()
  end

  defp advance_cursor(run, cursor) do
    run
    |> IndexRun.changeset(%{cursor: cursor})
    |> Repo.update!()
    |> enqueue_next_batch()
  end

  defp start_index_scan(run) do
    run
    |> IndexRun.changeset(%{phase: :index_scan, cursor: nil})
    |> Repo.update!()
    |> enqueue_next_batch()
  end

  defp complete_run(run) do
    status = if run.failed_count > 0, do: :completed_with_errors, else: :completed

    run
    |> IndexRun.changeset(%{status: status, completed_at: DateTime.utc_now()})
    |> Repo.update!()
  end

  defp enqueue_next_batch(run) do
    %{
      run_id: run.id,
      source_type: Atom.to_string(run.source_type),
      phase: Atom.to_string(run.phase),
      cursor: run.cursor,
      batch_size: Application.get_env(:operately, :search_index_batch_size, 500)
    }
    |> MaintenanceWorker.new()
    |> Oban.insert!()

    run
  end

  defp fail_run(run, reason) do
    run
    |> IndexRun.changeset(%{
      status: :failed,
      completed_at: DateTime.utc_now(),
      last_error: ErrorCategory.sanitize(reason)
    })
    |> Repo.update!()

    :ok
  end
end

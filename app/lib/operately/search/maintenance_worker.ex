defmodule Operately.Search.MaintenanceWorker do
  use Oban.Worker,
    queue: :search_maintenance,
    max_attempts: 5,
    unique: [period: :infinity, fields: [:worker, :args], states: [:available, :scheduled, :executing, :retryable]]

  require Logger

  alias Operately.Repo
  alias Operately.Search.{ErrorCategory, IndexMaintenance, IndexRun}

  @impl Oban.Worker
  def perform(%Oban.Job{args: args, attempt: attempt, max_attempts: max_attempts}) do
    case IndexMaintenance.run_batch(args) do
      {:ok, %IndexRun{} = run} ->
        log_terminal_run(run)
        :ok

      {:ok, _result} ->
        :ok

      {:error, reason} when attempt >= max_attempts ->
        log_failure(args, attempt, reason)

        case IndexMaintenance.mark_failed(args, reason) do
          :ok ->
            IndexRun |> Repo.get(args["run_id"]) |> log_terminal_run()
            {:discard, "search index maintenance failed"}

          {:error, persistence_reason} ->
            log_status_persistence_failure(args, attempt, persistence_reason)
            {:error, "search index maintenance failure status was not persisted"}
        end

      {:error, reason} ->
        log_failure(args, attempt, reason)
        {:error, "search index maintenance failed"}
    end
  end

  defp log_failure(args, attempt, reason) do
    Logger.warning("Search index maintenance batch failed", failure_metadata(args, attempt, reason))
  end

  defp log_status_persistence_failure(args, attempt, reason) do
    Logger.error("Search index maintenance failure status was not persisted", failure_metadata(args, attempt, reason))
  end

  defp log_terminal_run(%IndexRun{status: :completed} = run) do
    Logger.info("Search index maintenance completed", terminal_metadata(run))
  end

  defp log_terminal_run(%IndexRun{status: status} = run) when status in [:completed_with_errors, :failed] do
    Logger.warning("Search index maintenance completed with problems", terminal_metadata(run))
  end

  defp log_terminal_run(_run), do: :ok

  defp terminal_metadata(run) do
    [
      run_id: run.id,
      source_type: run.source_type,
      kind: run.kind,
      status: run.status,
      processed_count: run.processed_count,
      inserted_count: run.inserted_count,
      updated_count: run.updated_count,
      unchanged_count: run.unchanged_count,
      superseded_count: run.superseded_count,
      skipped_count: run.skipped_count,
      failed_count: run.failed_count,
      deleted_orphan_count: run.deleted_orphan_count,
      duration_ms: duration_ms(run),
      error: run.last_error
    ]
  end

  defp duration_ms(%{started_at: %DateTime{} = started_at, completed_at: %DateTime{} = completed_at}) do
    DateTime.diff(completed_at, started_at, :millisecond)
  end

  defp duration_ms(_run), do: nil

  defp failure_metadata(args, attempt, reason) do
    [
      run_id: args["run_id"],
      source_type: args["source_type"] || "unknown",
      phase: args["phase"],
      attempt: attempt,
      reason: ErrorCategory.sanitize(reason)
    ]
  end
end

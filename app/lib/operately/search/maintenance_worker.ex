defmodule Operately.Search.MaintenanceWorker do
  use Oban.Worker,
    queue: :default,
    max_attempts: 5,
    unique: [period: :infinity, fields: [:worker, :args], states: [:available, :scheduled, :executing, :retryable]]

  require Logger

  alias Operately.Search.{ErrorCategory, IndexMaintenance}

  @impl Oban.Worker
  def perform(%Oban.Job{args: args, attempt: attempt, max_attempts: max_attempts}) do
    case IndexMaintenance.run_batch(args) do
      {:ok, _result} ->
        :ok

      {:error, reason} when attempt >= max_attempts ->
        log_failure(args, attempt, reason)
        IndexMaintenance.mark_failed(args, reason)
        {:discard, "search index maintenance failed"}

      {:error, reason} ->
        log_failure(args, attempt, reason)
        {:error, "search index maintenance failed"}
    end
  end

  defp log_failure(args, attempt, reason) do
    Logger.warning("Search index maintenance batch failed",
      run_id: args["run_id"],
      source_type: args["source_type"] || "unknown",
      phase: args["phase"],
      attempt: attempt,
      reason: ErrorCategory.sanitize(reason)
    )
  end
end

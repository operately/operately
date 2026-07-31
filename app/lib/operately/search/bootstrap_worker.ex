defmodule Operately.Search.BootstrapWorker do
  @moduledoc """
  Starts the first search-index backfill after Oban boots.

  Historical index runs are the durable source of truth. Reboots therefore start
  newly registered sources without repeating any source that already attempted a
  backfill.
  """

  use Oban.Worker,
    queue: :search_maintenance,
    max_attempts: 10,
    unique: [period: :infinity, fields: [:worker], states: [:available, :scheduled, :executing, :retryable]]

  require Logger

  alias Operately.Search.MaintenanceRuns

  @impl Oban.Worker
  def perform(_job) do
    case MaintenanceRuns.start_initial_backfills() do
      {:ok, result} ->
        Logger.info("Search index bootstrap completed",
          started_source_types: result.started_source_types,
          already_running_source_types: result.already_running_source_types
        )

        :ok

      {:error, reason} ->
        {:error, reason}
    end
  end
end

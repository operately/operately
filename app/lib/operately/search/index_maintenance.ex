defmodule Operately.Search.IndexMaintenance do
  @moduledoc """
  Coordinates one transactional batch of a search-index maintenance run.

  It claims the run's saved checkpoint, resolves its configured source adapter,
  delegates synchronization to `BatchProcessor`, and passes the result to
  `RunLifecycle`. The surrounding transaction keeps index changes, run progress, and
  scheduling of the next Oban job atomic.
  """

  alias Operately.Repo
  alias Operately.Search.SourceRegistry
  alias Operately.Search.IndexMaintenance.{BatchProcessor, RunLifecycle}

  def run_batch(%{"run_id" => run_id, "phase" => phase, "cursor" => cursor, "batch_size" => batch_size}) do
    Repo.transaction(fn ->
      case RunLifecycle.claim(run_id, phase, cursor) do
        {:ok, run} -> process_batch(run, batch_size)
        {:ignored, reason} -> {:ignored, reason}
      end
    end)
  rescue
    error -> {:error, error}
  end

  defdelegate mark_failed(args, reason), to: RunLifecycle

  defp process_batch(run, batch_size) do
    source_type = Atom.to_string(run.source_type)

    with {:ok, source_module} <- SourceRegistry.fetch(source_type),
         {:ok, result} <- BatchProcessor.run(run, source_module, batch_size) do
      RunLifecycle.record_batch(run, result)
    else
      {:error, reason} -> Repo.rollback(reason)
    end
  end
end

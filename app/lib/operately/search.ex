defmodule Operately.Search do
  @moduledoc """
  Provides search queries and manages search-index maintenance runs.

  Each registered source type gets its own `Operately.Search.IndexRun`, with an
  independent cursor, counters, status, and chain of Oban batch jobs. A run starts with
  one job; each completed batch enqueues the next job for that same source type. This
  allows different source types to progress independently and run concurrently.

  Passing `:all` starts one run per registered source type. Those runs are created in
  separate transactions, so runs started before a later failure remain active.
  """

  alias Ecto.Multi
  alias Operately.Repo
  alias Operately.ResourceHubs.ResourceHub
  alias Operately.Search.{IndexRun, MaintenanceWorker, ResourceHubQuery, SourceRegistry}

  @doc """
  Returns relevance-ranked full-text results from an already-authorized resource hub.
  """
  def search_resource_hub(%ResourceHub{} = hub, query), do: ResourceHubQuery.search(hub, query)

  @doc """
  Starts a backfill for one source type string, or one independent backfill per
  registered source type when given `:all`.
  """
  def start_backfill(source_type), do: start_runs(:backfill, source_type)

  @doc """
  Starts reconciliation for one source type string, or one independent reconciliation
  run per registered source type when given `:all`.
  """
  def start_reconciliation(source_type), do: start_runs(:reconciliation, source_type)

  @doc "Returns the maintenance run with the given ID, or `nil` when it does not exist."
  def get_index_run(id), do: Repo.get(IndexRun, id)

  defp start_runs(kind, :all) do
    with {:ok, source_types} <- SourceRegistry.source_types(),
         false <- source_types == [] do
      source_types
      |> Enum.reduce_while({:ok, []}, fn source_type, {:ok, runs} ->
        case start_run(kind, source_type) do
          {:ok, run} -> {:cont, {:ok, [run | runs]}}
          {:error, reason} -> {:halt, {:error, reason}}
        end
      end)
      |> case do
        {:ok, runs} -> {:ok, Enum.reverse(runs)}
        error -> error
      end
    else
      true -> {:error, :no_sources_registered}
      error -> error
    end
  end

  defp start_runs(kind, source_type) when is_binary(source_type), do: start_run(kind, source_type)
  defp start_runs(_kind, _source_type), do: {:error, :unknown_source_type}

  defp start_run(kind, source_type) do
    with {:ok, _source_module} <- SourceRegistry.fetch(source_type) do
      Multi.new()
      |> Multi.insert(:run, IndexRun.changeset(%{kind: kind, source_type: source_type}))
      |> Oban.insert(:job, fn %{run: run} -> MaintenanceWorker.new(initial_job_args(run)) end)
      |> Repo.transaction()
      |> case do
        {:ok, %{run: run}} -> {:ok, run}
        {:error, :run, changeset, _changes} -> {:error, changeset}
        {:error, _operation, reason, _changes} -> {:error, reason}
      end
    end
  end

  defp initial_job_args(run) do
    %{
      run_id: run.id,
      source_type: Atom.to_string(run.source_type),
      phase: "source_scan",
      cursor: nil,
      batch_size: Application.get_env(:operately, :search_index_batch_size, 500)
    }
  end
end

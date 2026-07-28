defmodule Operately.Search.Maintenance do
  @moduledoc """
  Starts and inspects durable search-index backfill and reconciliation runs.

  Each registered adapter receives an independent run. Oban processes each run
  in resumable batches while `Run` stores its progress and counters.
  """

  alias Ecto.Multi
  alias Operately.Repo
  alias Operately.Search.Indexing.AdapterRegistry
  alias Operately.Search.Maintenance.{Run, Worker}

  def start_backfill(source_type), do: start_runs(:backfill, source_type)
  def start_reconciliation(source_type), do: start_runs(:reconciliation, source_type)
  def get_run(id), do: Repo.get(Run, id)

  defp start_runs(kind, :all) do
    with {:ok, source_types} <- AdapterRegistry.source_types(),
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
    with {:ok, _adapter} <- AdapterRegistry.fetch(source_type) do
      Multi.new()
      |> Multi.insert(:run, Run.changeset(%{kind: kind, source_type: source_type}))
      |> Oban.insert(:job, fn %{run: run} -> Worker.new(initial_job_args(run)) end)
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

defmodule Operately.Search.MaintenanceRuns do
  @moduledoc """
  Creates and reports durable search-index backfill and reconciliation runs.

  Each source type has an independent run and chain of Oban batch jobs. Runs
  started for multiple sources use separate transactions, so one source failing
  to start does not roll back runs already created for other sources.
  """

  import Ecto.Query

  alias Ecto.{Changeset, Multi}
  alias Operately.Repo
  alias Operately.Search.{IndexRun, MaintenanceWorker, SourceRegistry}

  @doc "Starts a backfill for one source type or every registered source."
  def start_backfill(source_type), do: start_runs(:backfill, source_type)

  @doc "Starts reconciliation for one source type or every registered source."
  def start_reconciliation(source_type), do: start_runs(:reconciliation, source_type)

  @doc "Returns the maintenance run with the given ID, or `nil` when it does not exist."
  def get(id), do: Repo.get(IndexRun, id)

  @doc "Returns every registered source type with its latest maintenance run."
  def list_source_statuses do
    with {:ok, source_types} <- SourceRegistry.source_types() do
      latest_runs =
        from(run in IndexRun,
          distinct: run.source_type,
          order_by: [asc: run.source_type, desc: run.inserted_at, desc: run.id]
        )
        |> Repo.all()
        |> Map.new(fn run -> {Atom.to_string(run.source_type), run} end)

      {:ok, Enum.map(source_types, &%{source_type: &1, latest_run: Map.get(latest_runs, &1)})}
    end
  end

  @doc "Starts maintenance for one source type or every registered source."
  def start(kind, source_type) when kind in [:backfill, :reconciliation] do
    case source_type do
      :all -> start_available_runs(kind, :all)
      source_type when is_binary(source_type) -> start_one_available_run(kind, source_type)
      _ -> {:error, :unknown_source_type}
    end
  end

  def start(_kind, _source_type), do: {:error, :unknown_maintenance_kind}

  @doc "Starts the first backfill for registered sources that have never had one."
  def start_initial_backfills do
    with {:ok, source_types} <- SourceRegistry.source_types(),
         historical_source_types <- historical_backfill_source_types() do
      missing_source_types = source_types -- historical_source_types
      start_available_runs(:backfill, missing_source_types)
    end
  end

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

  defp start_one_available_run(kind, source_type) do
    case start_run(kind, source_type) do
      {:ok, run} -> {:ok, %{started_source_types: [Atom.to_string(run.source_type)], already_running_source_types: []}}
      {:error, %Changeset{} = changeset} -> if active_run_conflict?(changeset), do: {:error, :already_running}, else: {:error, changeset}
      error -> error
    end
  end

  defp start_available_runs(kind, :all) do
    with {:ok, source_types} <- SourceRegistry.source_types(),
         false <- source_types == [] do
      start_available_runs(kind, source_types)
    else
      true -> {:error, :no_sources_registered}
      error -> error
    end
  end

  defp start_available_runs(_kind, []), do: {:ok, %{started_source_types: [], already_running_source_types: []}}

  defp start_available_runs(kind, source_types) when is_list(source_types) do
    source_types
    |> Enum.reduce_while({:ok, %{started_source_types: [], already_running_source_types: []}}, fn source_type, {:ok, result} ->
      case start_run(kind, source_type) do
        {:ok, _run} -> {:cont, {:ok, Map.update!(result, :started_source_types, &[source_type | &1])}}
        {:error, %Changeset{} = changeset} -> record_active_conflict_or_stop(changeset, source_type, result)
        {:error, reason} -> {:halt, {:error, reason}}
      end
    end)
    |> reverse_started_source_types()
  end

  defp record_active_conflict_or_stop(changeset, source_type, result) do
    if active_run_conflict?(changeset) do
      {:cont, {:ok, Map.update!(result, :already_running_source_types, &[source_type | &1])}}
    else
      {:halt, {:error, changeset}}
    end
  end

  defp reverse_started_source_types({:ok, result}) do
    {:ok,
     %{
       started_source_types: Enum.reverse(result.started_source_types),
       already_running_source_types: Enum.reverse(result.already_running_source_types)
     }}
  end

  defp reverse_started_source_types(error), do: error

  defp active_run_conflict?(changeset) do
    Enum.any?(changeset.errors, fn
      {:source_type, {_message, options}} -> options[:constraint_name] == "search_index_runs_one_active_per_source_index"
      _ -> false
    end)
  end

  defp historical_backfill_source_types do
    from(run in IndexRun, where: run.kind == :backfill, distinct: run.source_type, select: run.source_type)
    |> Repo.all()
    |> Enum.map(&Atom.to_string/1)
  end

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

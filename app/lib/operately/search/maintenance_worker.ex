defmodule Operately.Search.MaintenanceWorker do
  use Oban.Worker,
    queue: :default,
    max_attempts: 5,
    unique: [period: :infinity, fields: [:worker, :args], states: [:available, :scheduled, :executing, :retryable]]

  require Logger

  alias Operately.Search.IndexMaintenance

  @impl Oban.Worker
  def perform(%Oban.Job{args: args, attempt: attempt, max_attempts: max_attempts}) do
    case IndexMaintenance.run_batch(args) do
      {:ok, _result} ->
        :ok

      {:error, reason} when attempt >= max_attempts ->
        IndexMaintenance.mark_failed(args["run_id"], reason)
        {:discard, "search index maintenance failed"}

      {:error, reason} ->
        Logger.warning("Search index maintenance batch failed", reason: error_category(reason))
        {:error, "search index maintenance failed"}
    end
  end

  defp error_category(%{__struct__: module}), do: inspect(module)
  defp error_category(reason) when is_atom(reason), do: Atom.to_string(reason)
  defp error_category(_reason), do: "unknown"
end

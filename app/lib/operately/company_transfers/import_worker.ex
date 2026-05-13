defmodule Operately.CompanyTransfers.ImportWorker do
  use Oban.Worker, queue: :default
  require Logger

  alias Operately.CompanyTransfers
  alias Operately.CompanyTransfers.Importer
  alias Operately.CompanyTransfers.PublicErrorMessage

  @impl Oban.Worker
  def perform(%Oban.Job{args: %{"import_run_id" => import_run_id}}) do
    case CompanyTransfers.get_import_run(import_run_id) do
      nil ->
        :ok

      %{status: :cancelled} ->
        :ok

      run ->
        {:ok, run} = CompanyTransfers.mark_import_run_running(run)

        case Importer.run(run) do
          {:ok, _run} ->
            :ok

          {:error, reason} ->
            Logger.error("Company import failed for run #{run.id}: #{inspect(reason)}")
            {:ok, _run} = CompanyTransfers.mark_import_run_failed(run, PublicErrorMessage.for_import(reason), failure_attrs(reason))
            :ok
        end

        :ok
    end
  rescue
    error ->
      handle_trapped_failure(import_run_id, {:error, error, __STACKTRACE__})
  catch
    kind, reason ->
      handle_trapped_failure(import_run_id, {kind, reason})
  end

  defp failure_attrs({:validation_failed, _message, errors}), do: %{validation_errors: errors}
  defp failure_attrs(_reason), do: %{}

  defp handle_trapped_failure(import_run_id, {:error, error, stacktrace}) do
    Logger.error(Exception.format(:error, error, stacktrace))

    if run = CompanyTransfers.get_import_run(import_run_id) do
      {:ok, _run} = CompanyTransfers.mark_import_run_failed(run, PublicErrorMessage.for_import({:error, error, stacktrace}))
    end

    :ok
  end

  defp handle_trapped_failure(import_run_id, {kind, reason}) do
    message = Exception.format_banner(kind, reason)
    Logger.error(message)

    if run = CompanyTransfers.get_import_run(import_run_id) do
      {:ok, _run} = CompanyTransfers.mark_import_run_failed(run, PublicErrorMessage.for_import({kind, reason}))
    end

    :ok
  end
end

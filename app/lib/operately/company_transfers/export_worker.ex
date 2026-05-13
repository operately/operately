defmodule Operately.CompanyTransfers.ExportWorker do
  use Oban.Worker, queue: :default
  require Logger

  alias Operately.CompanyTransfers
  alias Operately.CompanyTransfers.Exporter
  alias Operately.CompanyTransfers.PublicErrorMessage

  @impl Oban.Worker
  def perform(%Oban.Job{args: %{"export_run_id" => export_run_id}}) do
    case CompanyTransfers.get_export_run(export_run_id) do
      nil ->
        :ok

      %{status: :cancelled} ->
        :ok

      run ->
        {:ok, run} = CompanyTransfers.mark_export_run_running(run)

        case Exporter.run(run) do
          {:ok, _run} ->
            :ok

          {:error, reason} ->
            Logger.error("Company export failed for run #{run.id}: #{inspect(reason)}")
            {:ok, _run} = CompanyTransfers.mark_export_run_failed(run, PublicErrorMessage.for_export(reason))
            :ok
        end
    end
  rescue
    error ->
      handle_trapped_failure(export_run_id, {:error, error, __STACKTRACE__})
  catch
    kind, reason ->
      handle_trapped_failure(export_run_id, {kind, reason})
  end

  defp handle_trapped_failure(export_run_id, {:error, error, stacktrace}) do
    Logger.error(Exception.format(:error, error, stacktrace))

    if run = CompanyTransfers.get_export_run(export_run_id) do
      {:ok, _run} = CompanyTransfers.mark_export_run_failed(run, PublicErrorMessage.for_export({:error, error, stacktrace}))
    end

    :ok
  end

  defp handle_trapped_failure(export_run_id, {kind, reason}) do
    message = Exception.format_banner(kind, reason)
    Logger.error(message)

    if run = CompanyTransfers.get_export_run(export_run_id) do
      {:ok, _run} = CompanyTransfers.mark_export_run_failed(run, PublicErrorMessage.for_export({kind, reason}))
    end

    :ok
  end
end

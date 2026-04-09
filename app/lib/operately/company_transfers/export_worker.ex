defmodule Operately.CompanyTransfers.ExportWorker do
  use Oban.Worker, queue: :default
  require Logger

  alias Operately.CompanyTransfers
  alias Operately.CompanyTransfers.Exporter

  @impl Oban.Worker
  def perform(%Oban.Job{args: %{"export_run_id" => export_run_id}}) do
    case CompanyTransfers.get_export_run(export_run_id) do
      nil ->
        :ok

      %{status: :cancelled} ->
        :ok

      run ->
        {:ok, run} = CompanyTransfers.mark_export_run_running(run)

        {:error, {:not_implemented, message}} = Exporter.run(run)

        {:ok, _run} = CompanyTransfers.mark_export_run_failed(run, message)
        :ok
    end
  rescue
    error ->
      Logger.error(Exception.format(:error, error, __STACKTRACE__))

      if run = CompanyTransfers.get_export_run(export_run_id) do
        {:ok, _run} = CompanyTransfers.mark_export_run_failed(run, Exception.message(error))
      end

      :ok
  end
end

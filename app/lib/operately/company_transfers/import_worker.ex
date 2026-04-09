defmodule Operately.CompanyTransfers.ImportWorker do
  use Oban.Worker, queue: :default
  require Logger

  alias Operately.CompanyTransfers
  alias Operately.CompanyTransfers.Importer

  @impl Oban.Worker
  def perform(%Oban.Job{args: %{"import_run_id" => import_run_id}}) do
    case CompanyTransfers.get_import_run(import_run_id) do
      nil ->
        :ok

      %{status: :cancelled} ->
        :ok

      run ->
        {:ok, run} = CompanyTransfers.mark_import_run_running(run)

        {:error, {:not_implemented, message}} = Importer.run(run)

        {:ok, _run} = CompanyTransfers.mark_import_run_failed(run, message)
        :ok
    end
  rescue
    error ->
      Logger.error(Exception.format(:error, error, __STACKTRACE__))

      if run = CompanyTransfers.get_import_run(import_run_id) do
        {:ok, _run} = CompanyTransfers.mark_import_run_failed(run, Exception.message(error))
      end

      :ok
  end
end

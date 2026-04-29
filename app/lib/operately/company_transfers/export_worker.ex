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

        case Exporter.run(run) do
          {:ok, _run} ->
            :ok

          {:error, reason} ->
            {:ok, _run} = CompanyTransfers.mark_export_run_failed(run, format_reason(reason))
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

  defp format_reason({:exception, message}) when is_binary(message), do: message
  defp format_reason({:no_company_path, table}) when is_binary(table), do: "No ownership path to company for table #{table}"
  defp format_reason(:company_not_found), do: "Company not found"
  defp format_reason(reason) when is_binary(reason), do: reason
  defp format_reason(reason), do: inspect(reason)

  defp handle_trapped_failure(export_run_id, {:error, error, stacktrace}) do
    Logger.error(Exception.format(:error, error, stacktrace))

    if run = CompanyTransfers.get_export_run(export_run_id) do
      {:ok, _run} = CompanyTransfers.mark_export_run_failed(run, Exception.message(error))
    end

    :ok
  end

  defp handle_trapped_failure(export_run_id, {kind, reason}) do
    message = Exception.format_banner(kind, reason)
    Logger.error(message)

    if run = CompanyTransfers.get_export_run(export_run_id) do
      {:ok, _run} = CompanyTransfers.mark_export_run_failed(run, message)
    end

    :ok
  end
end

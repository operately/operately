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

        case Importer.run(run) do
          {:ok, _run} ->
            :ok

          {:error, {:validation_failed, message, errors}} ->
            {:ok, _run} = CompanyTransfers.mark_import_run_failed(run, message, %{validation_errors: errors})
            :ok

          {:error, {:package_not_found, path}} ->
            {:ok, _run} = CompanyTransfers.mark_import_run_failed(run, "Import package not found: #{inspect(path)}")
            :ok

          {:error, {:exception, message}} ->
            {:ok, _run} = CompanyTransfers.mark_import_run_failed(run, message)
            :ok

          {:error, reason} ->
            {:ok, _run} = CompanyTransfers.mark_import_run_failed(run, format_reason(reason))
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

  defp format_reason({:account_creation_failed, email, changeset}) do
    "Failed to create imported account #{email}: #{inspect(changeset.errors)}"
  end

  defp format_reason({:invalid_account_row, row}) do
    "Invalid imported account row: #{inspect(row)}"
  end

  defp format_reason({:missing_reference_translation, table, column, referenced_table, source_id}) do
    "Missing reference translation for #{table}.#{column} -> #{referenced_table} (#{source_id})"
  end

  defp format_reason(reason), do: inspect(reason)

  defp handle_trapped_failure(import_run_id, {:error, error, stacktrace}) do
    Logger.error(Exception.format(:error, error, stacktrace))

    if run = CompanyTransfers.get_import_run(import_run_id) do
      {:ok, _run} = CompanyTransfers.mark_import_run_failed(run, Exception.message(error))
    end

    :ok
  end

  defp handle_trapped_failure(import_run_id, {kind, reason}) do
    message = Exception.format_banner(kind, reason)
    Logger.error(message)

    if run = CompanyTransfers.get_import_run(import_run_id) do
      {:ok, _run} = CompanyTransfers.mark_import_run_failed(run, message)
    end

    :ok
  end
end

defmodule Operately.CompanyTransfers.ImportWorker do
  use Oban.Worker, queue: :default
  require Logger

  import Ecto.Changeset, only: [traverse_errors: 2]

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
            Logger.error("Company import failed for run #{run.id}: #{format_failure_reason(reason)}")
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

  defp format_failure_reason({:account_creation_failed, email, %Ecto.Changeset{} = changeset}) do
    "failed to create imported account for #{email}: #{format_changeset_errors(changeset)}"
  end

  defp format_failure_reason({:invalid_account_row, account_row}) do
    "invalid account row in package: #{inspect(account_row)}"
  end

  defp format_failure_reason({:package_not_found, reason}) do
    "import package unavailable: #{inspect(reason)}"
  end

  defp format_failure_reason({:package_limit_exceeded, limit, max, actual}) do
    "package exceeds configured import limit #{limit} (max=#{max}, actual=#{actual})"
  end

  defp format_failure_reason({:validation_failed, message, errors}) do
    "#{message} (validation_errors=#{inspect(errors)})"
  end

  defp format_failure_reason({:exception, message}) when is_binary(message) do
    "unexpected exception inside importer: #{message}"
  end

  defp format_failure_reason(reason), do: inspect(reason)

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

  defp format_changeset_errors(changeset) do
    changeset
    |> traverse_errors(fn {message, opts} ->
      Regex.replace(~r"%{(\w+)}", message, fn _, key ->
        opts |> Keyword.get(String.to_existing_atom(key), key) |> to_string()
      end)
    end)
    |> Enum.map_join(", ", fn {field, messages} ->
      "#{field}: #{Enum.join(messages, ", ")}"
    end)
  end
end

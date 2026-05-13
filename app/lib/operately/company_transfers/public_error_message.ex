defmodule Operately.CompanyTransfers.PublicErrorMessage do
  alias Operately.CompanyTransfers.{ExportRun, ImportRun}

  @export_company_missing "This company is no longer available to export."
  @export_generic "We couldn't create the export package. Please try again. If it keeps failing, contact support."

  @import_damaged_zip "This ZIP file looks incomplete or damaged. Export the company again and try again."
  @import_duplicate_emails "This package contains duplicate email addresses and can't be imported until that is fixed."
  @import_missing_people_data "This export package is missing some people data and can't be imported."
  @import_too_large "This package is too large to import here."
  @import_generic "We couldn't import this company. Please try again with a new export package. If it keeps failing, contact support."

  def for_export(%ExportRun{} = run) do
    if failed_status?(run.status) do
      case run.error_message do
        message when is_binary(message) -> export_message_from_text(message)
        _ -> @export_generic
      end
    end
  end

  def for_export(:company_not_found), do: @export_company_missing
  def for_export({:exception, message}) when is_binary(message), do: export_message_from_text(message)
  def for_export({:error, error, _stacktrace}) when is_map(error), do: export_message_from_text(Exception.message(error))
  def for_export(message) when is_binary(message), do: export_message_from_text(message)
  def for_export(_reason), do: @export_generic

  def for_import(%ImportRun{} = run) do
    if failed_status?(run.status) do
      validation_errors = import_message_from_validation_errors(run.validation_errors)

      cond do
        validation_errors != nil ->
          validation_errors

        is_binary(run.error_message) ->
          import_message_from_text(run.error_message)

        true ->
          @import_generic
      end
    end
  end

  def for_import({:validation_failed, _message, errors}), do: import_message_from_validation_errors(errors) || @import_generic
  def for_import({:package_not_found, _reason}), do: @import_damaged_zip
  def for_import({:package_limit_exceeded, _limit, _max, _actual}), do: @import_too_large
  def for_import({:missing_file_blob_translation, _source_blob_id}), do: @import_damaged_zip
  def for_import({:exception, message}) when is_binary(message), do: import_message_from_text(message)
  def for_import({:error, error, _stacktrace}) when is_map(error), do: import_message_from_text(Exception.message(error))
  def for_import(message) when is_binary(message), do: import_message_from_text(message)
  def for_import(_reason), do: @import_generic

  defp failed_status?(status), do: status in [:failed, "failed"]

  defp export_message_from_text(message) do
    if contains_any?(message, ["company not found", "no longer available to export"]) do
      @export_company_missing
    else
      @export_generic
    end
  end

  defp import_message_from_validation_errors(errors) when is_list(errors) do
    errors
    |> Enum.map(&validation_error_to_message/1)
    |> Enum.reject(&is_nil/1)
    |> Enum.uniq()
    |> case do
      [] -> nil
      messages -> Enum.join(messages, " ")
    end
  end

  defp import_message_from_validation_errors(_errors), do: nil

  defp validation_error_to_message(error) when is_map(error) do
    case Map.get(error, "code") || Map.get(error, :code) do
      "package_limit_exceeded" -> @import_too_large
      "duplicate_account_emails" -> @import_duplicate_emails
      "invalid_message_authors" -> @import_missing_people_data
      "invalid_goal_update_authors" -> @import_missing_people_data
      "invalid_company_count" -> @import_damaged_zip
      "file_count_mismatch" -> @import_damaged_zip
      "invalid_file_entries" -> @import_damaged_zip
      nil -> nil
      _code -> @import_generic
    end
  end

  defp validation_error_to_message(_error), do: nil

  defp import_message_from_text(message) do
    cond do
      contains_any?(message, ["duplicate account emails", "duplicate email addresses"]) ->
        @import_duplicate_emails

      contains_any?(message, ["without a valid author", "missing some people data"]) ->
        @import_missing_people_data

      contains_any?(message, [
        "package exceeds configured import limit",
        "exceeds size limit",
        "max_zip_size_bytes",
        "max_json_size_bytes"
      ]) ->
        @import_too_large

      damaged_zip_message?(message) ->
        @import_damaged_zip

      true ->
        @import_generic
    end
  end

  defp damaged_zip_message?(message) do
    contains_any?(message, [
      "archive does not contain data.json",
      "archive contains duplicate",
      "archive contains undeclared entries",
      "archive is missing declared entries",
      "failed to inspect zip archive",
      "failed to read",
      "failed to extract zip archive",
      "unexpected byte",
      "unexpected end of input",
      "invalid json",
      "import package not found",
      "no package blob associated with import run",
      "manifest files_count does not match package files",
      "package contains invalid file entries",
      "package must contain exactly one company row"
    ])
  end

  defp contains_any?(message, fragments) when is_binary(message) do
    message = String.downcase(message)
    Enum.any?(fragments, &String.contains?(message, &1))
  end
end

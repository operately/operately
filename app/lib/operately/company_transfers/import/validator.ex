defmodule Operately.CompanyTransfers.Import.Validator do
  @moduledoc """
  Validates whether a package can be imported by the current Operately instance.
  """

  alias Operately.CompanyTransfers.Import.Package
  alias Operately.CompanyTransfers.Package.Limits

  @package_format_version 1

  def validate(%Package{} = package) do
    []
    |> validate_manifest(package)
    |> validate_package_limits(package)
    |> validate_company_row(package)
    |> validate_account_emails(package)
    |> validate_files(package)
    |> Enum.reverse()
    |> case do
      [] -> :ok
      errors -> {:error, errors}
    end
  end

  defp validate_manifest(errors, %Package{manifest: manifest}) do
    errors
    |> validate_package_format(manifest)
    |> validate_operately_version(manifest)
  end

  defp validate_package_format(errors, manifest) do
    if manifest["package_format_version"] == @package_format_version do
      errors
    else
      [error("unsupported_package_format", "Unsupported package format version", %{
         "expected" => @package_format_version,
         "actual" => manifest["package_format_version"]
       }) | errors]
    end
  end

  defp validate_operately_version(errors, manifest) do
    current_version = Operately.version()

    if manifest["operately_version"] == current_version do
      errors
    else
      [error("operately_version_mismatch", "Operately version does not match the package", %{
         "expected" => current_version,
         "actual" => manifest["operately_version"]
       }) | errors]
    end
  end

  defp validate_package_limits(errors, %Package{} = package) do
    errors
    |> validate_count_limit(:max_tables_count, length(package.tables))
    |> validate_count_limit(:max_rows_count, rows_count(package))
    |> validate_count_limit(:max_files_count, length(package.files))
  end

  defp validate_count_limit(errors, limit, value) do
    case Limits.validate_value(limit, value) do
      :ok ->
        errors

      {:error, {:package_limit_exceeded, ^limit, max, actual}} ->
        [error("package_limit_exceeded", "Package exceeds configured import limit", %{
           "limit" => Atom.to_string(limit),
           "max" => max,
           "actual" => actual
         }) | errors]
    end
  end

  defp rows_count(%Package{} = package) do
    Enum.reduce(package.tables, 0, fn table, count ->
      count + length(Map.get(table, "rows", []))
    end)
  end

  defp validate_company_row(errors, %Package{} = package) do
    case Package.company_rows(package) do
      [_company_row] ->
        errors

      company_rows ->
        [error("invalid_company_count", "Package must contain exactly one company row", %{
           "count" => length(company_rows)
         }) | errors]
    end
  end

  defp validate_account_emails(errors, %Package{} = package) do
    duplicate_emails =
      package
      |> Package.account_rows()
      |> Enum.map(&normalized_email/1)
      |> Enum.reject(&is_nil/1)
      |> Enum.frequencies()
      |> Enum.filter(fn {_email, count} -> count > 1 end)
      |> Enum.map(&elem(&1, 0))

    if duplicate_emails == [] do
      errors
    else
      [error("duplicate_account_emails", "Package contains duplicate account emails", %{
         "emails" => duplicate_emails
       }) | errors]
    end
  end

  defp validate_files(errors, %Package{manifest: manifest, files: files}) do
    errors
    |> validate_files_count(manifest, files)
    |> validate_file_entries(files)
  end

  defp validate_files_count(errors, manifest, files) do
    expected = manifest["files_count"] || 0
    actual = length(files)

    if expected == actual do
      errors
    else
      [error("file_count_mismatch", "Manifest files_count does not match package files", %{
         "expected" => expected,
         "actual" => actual
       }) | errors]
    end
  end

  defp validate_file_entries(errors, files) do
    invalid_paths =
      files
      |> Enum.filter(&(not valid_file_entry?(&1)))
      |> Enum.map(&Map.get(&1, "path"))

    if invalid_paths == [] do
      errors
    else
      [error("invalid_file_entries", "Package contains invalid file entries", %{
         "paths" => invalid_paths
       }) | errors]
    end
  end

  defp normalized_email(%{"email" => email}) when is_binary(email) do
    email |> String.trim() |> String.downcase()
  end

  defp normalized_email(_), do: nil

  defp valid_file_entry?(%{"blob_id" => blob_id, "path" => path}) when is_binary(blob_id) and is_binary(path) do
    not String.starts_with?(path, "/") and not String.contains?(path, "../")
  end

  defp valid_file_entry?(_), do: false

  defp error(code, message, details) do
    %{
      "code" => code,
      "message" => message,
      "details" => details
    }
  end
end

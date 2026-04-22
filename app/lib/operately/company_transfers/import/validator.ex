defmodule Operately.CompanyTransfers.Import.Validator do
  @moduledoc """
  Validates whether a package can be imported by the current Operately instance.
  """

  alias Operately.CompanyTransfers.Import.Package
  alias Operately.Repo

  @package_format_version 1
  @supported_slice "relational_minimal"

  def validate(%Package{} = package) do
    []
    |> validate_manifest(package)
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
    |> validate_slice(manifest)
    |> validate_operately_version(manifest)
    |> validate_schema_migrations(manifest)
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

  defp validate_slice(errors, manifest) do
    if manifest["slice"] == @supported_slice do
      errors
    else
      [error("unsupported_package_slice", "Unsupported package slice", %{
         "expected" => @supported_slice,
         "actual" => manifest["slice"]
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

  defp validate_schema_migrations(errors, manifest) do
    current = load_schema_migrations()

    if manifest["schema_migrations"] == current do
      errors
    else
      [error("schema_migration_mismatch", "Schema migrations do not match the package", %{
         "expected" => current,
         "actual" => manifest["schema_migrations"]
       }) | errors]
    end
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

  defp load_schema_migrations do
    case Repo.query("SELECT version FROM schema_migrations ORDER BY version", []) do
      {:ok, %{rows: rows}} -> Enum.map(rows, fn [version] -> version end)
      {:error, _reason} -> []
    end
  end

  defp error(code, message, details) do
    %{
      "code" => code,
      "message" => message,
      "details" => details
    }
  end
end

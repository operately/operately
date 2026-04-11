defmodule Operately.CompanyTransfers.Import.Validator do
  @moduledoc """
  Validates whether a package can be imported by the current Operately instance.
  """

  import Ecto.Query, only: [from: 2]

  alias Operately.Companies.Company
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
      [company_row] ->
        validate_company_short_id(errors, company_row)

      company_rows ->
        [error("invalid_company_count", "Package must contain exactly one company row", %{
           "count" => length(company_rows)
         }) | errors]
    end
  end

  defp validate_company_short_id(errors, %{"short_id" => nil}), do: errors

  defp validate_company_short_id(errors, %{"short_id" => short_id}) do
    exists? =
      from(c in Company, where: c.short_id == ^short_id, select: 1)
      |> Repo.exists?()

    if exists? do
      [error("company_short_id_taken", "Company short_id is already taken on the destination instance", %{
         "short_id" => short_id
       }) | errors]
    else
      errors
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

  defp validate_files(errors, %Package{files: []}), do: errors

  defp validate_files(errors, %Package{files: files}) do
    [error("files_not_supported_yet", "This import slice does not support file payloads yet", %{
       "files_count" => length(files)
     }) | errors]
  end

  defp normalized_email(%{"email" => email}) when is_binary(email) do
    email |> String.trim() |> String.downcase()
  end

  defp normalized_email(_), do: nil

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

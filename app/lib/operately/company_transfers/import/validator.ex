defmodule Operately.CompanyTransfers.Import.Validator do
  @moduledoc """
  Validates whether a package can be imported by the current Operately instance.
  """

  alias Operately.CompanyTransfers.Import.Package
  alias Operately.CompanyTransfers.Package.Limits

  def validate(%Package{} = package) do
    []
    |> validate_package_limits(package)
    |> validate_company_row(package)
    |> validate_account_emails(package)
    |> validate_message_authors(package)
    |> validate_goal_update_authors(package)
    |> validate_files(package)
    |> Enum.reverse()
    |> case do
      [] -> :ok
      errors -> {:error, errors}
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

  defp validate_message_authors(errors, %Package{} = package) do
    validate_required_author_references(
      errors,
      package,
      "messages",
      "invalid_message_authors",
      "Package contains discussions without a valid author"
    )
  end

  defp validate_goal_update_authors(errors, %Package{} = package) do
    validate_required_author_references(
      errors,
      package,
      "goal_updates",
      "invalid_goal_update_authors",
      "Package contains goal check-ins without a valid author"
    )
  end

  defp validate_required_author_references(errors, %Package{} = package, table_name, code, message) do
    invalid_row_ids =
      package
      |> Package.table_rows(table_name)
      |> Enum.filter(&(not valid_uuid?(Map.get(&1, "author_id"))))
      |> Enum.map(&row_identifier/1)

    if invalid_row_ids == [] do
      errors
    else
      [error(code, message, %{"row_ids" => invalid_row_ids}) | errors]
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

  defp valid_uuid?(value) when is_binary(value) do
    match?({:ok, _}, Ecto.UUID.cast(value))
  end

  defp valid_uuid?(_), do: false

  defp row_identifier(%{"id" => id}) when is_binary(id), do: id
  defp row_identifier(_), do: "<missing id>"

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

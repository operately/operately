defmodule Operately.CompanyTransfers.Package.Limits do
  @moduledoc """
  Configurable safety limits for company transfer packages.

  ## Configuration

  Limits are configured in `config/config.exs` with defaults that can be overridden
  via environment variables in `config/runtime.exs`:

  - `OPERATELY_MAX_JSON_SIZE_BYTES` - Maximum size of JSON manifest (default: 50 MB)
  - `OPERATELY_MAX_ZIP_SIZE_BYTES` - Maximum size of ZIP archive (default: 1 GB)
  - `OPERATELY_MAX_EXTRACTED_FILE_SIZE_BYTES` - Maximum size of extracted files (default: 100 MB)
  - `OPERATELY_MAX_FILES_COUNT` - Maximum number of files (default: 10,000)
  - `OPERATELY_MAX_ROWS_COUNT` - Maximum number of database rows (default: 1,000,000)
  - `OPERATELY_MAX_TABLES_COUNT` - Maximum number of database tables (default: 200)

  ## Example

      # Get a specific limit
      Limits.get(:max_json_size_bytes)

      # Validate a value against a limit
      Limits.validate_value(:max_files_count, 5000)

      # Validate a file size
      Limits.validate_file_size(:max_zip_size_bytes, "/path/to/file.zip")
  """

  def all do
    Application.get_env(:operately, __MODULE__, [])
    |> Map.new()
  end

  def get(limit) when is_atom(limit) do
    Map.fetch!(all(), limit)
  end

  def validate_file_size(limit, path) when is_atom(limit) and is_binary(path) do
    case File.stat(path) do
      {:ok, %{size: size}} -> validate_value(limit, size)
      {:error, reason} -> {:error, {:package_file_stat_failed, path, reason}}
    end
  end

  def validate_value(limit, value) when is_atom(limit) and is_integer(value) do
    max = get(limit)

    if value <= max do
      :ok
    else
      {:error, {:package_limit_exceeded, limit, max, value}}
    end
  end
end

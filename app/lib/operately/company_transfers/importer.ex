defmodule Operately.CompanyTransfers.Importer do
  alias Operately.CompanyTransfers
  alias Operately.CompanyTransfers.Import.{Package, RelationalImporter, Validator}
  alias Operately.Repo

  @steps %{
    loading_package: 10.0,
    validating_package: 30.0,
    importing_rows: 70.0,
    finalizing_import: 90.0
  }

  def run(import_run) do
    with {:ok, json_path} <- fetch_json_path(import_run),
         :ok <- mark_progress(import_run, "loading_package", @steps.loading_package),
         package = Package.load!(json_path),
         :ok <- mark_progress(import_run, "validating_package", @steps.validating_package),
         :ok <- validate_package(package),
         :ok <- mark_progress(import_run, "importing_rows", @steps.importing_rows),
         {:ok, result} <- import_package(package),
         :ok <- mark_progress(import_run, "finalizing_import", @steps.finalizing_import),
         {:ok, import_run} <- complete_import(import_run, package, result) do
      {:ok, import_run}
    else
      {:error, _reason} = error ->
        error
    end
  rescue
    error ->
      {:error, {:exception, Exception.message(error)}}
  end

  defp fetch_json_path(import_run) do
    import_run = Repo.preload(import_run, [:json_blob, :zip_blob])

    cond do
      is_nil(import_run.json_blob) ->
        {:error, {:package_not_found, "No JSON blob associated with import run"}}

      true ->
        # Download blob to temporary workspace using Blobs helper
        workspace = Operately.CompanyTransfers.Package.Workspace.prepare!(:import, import_run.id)
        json_path = Path.join(workspace.root_path, "data.json")

        case Operately.Blobs.download_blob_to_file(import_run.json_blob, json_path) do
          :ok -> {:ok, json_path}
          {:error, reason} -> {:error, {:package_not_found, reason}}
        end
    end
  end

  defp validate_package(package) do
    case Validator.validate(package) do
      :ok -> :ok
      {:error, errors} -> {:error, {:validation_failed, validation_message(errors), errors}}
    end
  end

  defp import_package(package) do
    Repo.transaction(fn ->
      case RelationalImporter.import(package) do
        {:ok, result} -> result
        {:error, reason} -> Repo.rollback(reason)
      end
    end)
  end

  defp complete_import(import_run, package, result) do
    completion_attrs = %{
      company_id: result.company_id,
      current_step: "completed",
      total_steps: map_size(@steps),
      percentage: 100.0,
      current_table: nil,
      tables_count: result.tables_count,
      rows_count: result.rows_count,
      files_count: result.files_count,
      validation_errors: [],
      manifest_summary: %{
        "package_format_version" => package.manifest["package_format_version"],
        "slice" => package.manifest["slice"],
        "operately_version" => package.manifest["operately_version"],
        "source_company" => package.manifest["source_company"],
        "account_resolution" => %{
          "reused_count" => result.account_resolution.reused_count,
          "created_count" => result.account_resolution.created_count
        }
      }
    }

    CompanyTransfers.mark_import_run_completed(import_run, completion_attrs)
  end

  defp validation_message(errors) do
    errors
    |> Enum.map(& &1["message"])
    |> Enum.join("; ")
  end

  defp mark_progress(import_run, step, percentage) do
    case CompanyTransfers.update_import_run(import_run, %{
           current_step: step,
           total_steps: map_size(@steps),
           percentage: percentage
         }) do
      {:ok, _import_run} -> :ok
      {:error, reason} -> {:error, reason}
    end
  end
end

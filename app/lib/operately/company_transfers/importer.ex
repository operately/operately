defmodule Operately.CompanyTransfers.Importer do
  require Logger

  alias Operately.CompanyTransfers
  alias Operately.CompanyTransfers.BlobIO
  alias Operately.CompanyTransfers.Import.{FileImporter, ImporterOwnerFinalizer, Package, PostImportNotifier, RelationalImporter, Validator}
  alias Operately.CompanyTransfers.Package.{Archive, Limits, Workspace}
  alias Operately.Repo

  @steps %{
    loading_package: 10.0,
    validating_package: 30.0,
    importing_rows: 70.0,
    finalizing_import: 90.0
  }

  def run(import_run) do
    case load_package(import_run) do
      {:ok, workspace, package} ->
        case import_loaded_package(import_run, workspace, package) do
          {:ok, import_run} ->
            {:ok, import_run}

          {:error, _reason} = error ->
            save_failure_manifest_summary(import_run, package)
            error
        end

      {:error, _reason} = error ->
        error
    end
  rescue
    error ->
      {:error, {:exception, Exception.message(error)}}
  end

  defp load_package(import_run) do
    with {:ok, workspace} <- fetch_package_workspace(import_run),
         :ok <- mark_progress(import_run, "loading_package", @steps.loading_package),
         :ok <- validate_artifact_sizes(workspace),
         {:ok, package} <- load_package_from_archive(workspace),
         :ok <- mark_progress(import_run, "validating_package", @steps.validating_package) do
      {:ok, workspace, package}
    end
  end

  defp import_loaded_package(import_run, workspace, package) do
    with :ok <- validate_package(package),
         files_root <- extract_files(workspace, package),
         :ok <- mark_progress(import_run, "importing_rows", @steps.importing_rows),
         {:ok, result} <- import_package(package, files_root, import_run.requested_by_id),
         :ok <- mark_progress(import_run, "finalizing_import", @steps.finalizing_import),
         :ok <- notify_imported_people(import_run, result),
         {:ok, import_run} <- complete_import(import_run, package, result) do
      {:ok, import_run}
    end
  end

  defp fetch_package_workspace(import_run) do
    import_run = Repo.preload(import_run, :package_blob)

    cond do
      is_nil(import_run.package_blob) ->
        {:error, {:package_not_found, "No package blob associated with import run"}}

      true ->
        workspace = Workspace.prepare!(:import, import_run.id)

        with :ok <- download_blob(import_run.package_blob, workspace.zip_path) do
          {:ok, workspace}
        else
          {:error, reason} -> {:error, {:package_not_found, reason}}
        end
    end
  end

  defp validate_artifact_sizes(workspace) do
    Limits.validate_file_size(:max_zip_size_bytes, workspace.zip_path)
  end

  defp load_package_from_archive(workspace) do
    entries = Archive.list_entries!(workspace.zip_path)
    data_json_entry = find_data_json_entry!(entries)

    with :ok <- Limits.validate_value(:max_json_size_bytes, data_json_entry.size) do
      workspace.json_path
      |> File.write!(Archive.read_entry!(workspace.zip_path, "data.json"))

      {:ok, Package.load!(workspace.json_path)}
    end
  end

  defp find_data_json_entry!(entries) do
    case Enum.filter(entries, &(&1.path == "data.json")) do
      [entry] ->
        entry

      [] ->
        raise ArgumentError, "Archive does not contain data.json"

      duplicate_entries ->
        raise ArgumentError, "Archive contains duplicate data.json entries: #{inspect(duplicate_entries)}"
    end
  end

  defp extract_files(workspace, %Package{files: []}) do
    Archive.extract_present!(workspace.zip_path, workspace.root_path, ["data.json"])
    workspace.files_path
  end

  defp extract_files(workspace, %Package{} = package) do
    allowed_archive_paths = ["data.json" | Enum.map(package.files, &archive_file_path/1)]
    Archive.extract_present!(workspace.zip_path, workspace.root_path, allowed_archive_paths)
    workspace.files_path
  end

  defp archive_file_path(%{"path" => relative_path}) when is_binary(relative_path) do
    Path.join("files", relative_path)
  end

  defp validate_package(package) do
    case Validator.validate(package) do
      :ok -> :ok
      {:error, errors} -> {:error, {:validation_failed, validation_message(errors), errors}}
    end
  end

  defp import_package(package, files_root, requested_by_id) do
    Repo.transaction(fn ->
      with {:ok, result} <- RelationalImporter.import(package),
           {:ok, importer_person} <- ImporterOwnerFinalizer.finalize(result.company_id, requested_by_id),
           {:ok, files_count} <- FileImporter.import(package, files_root, result.blob_id_map) do
        result
        |> Map.put(:files_count, files_count)
        |> Map.put(:importer_person_id, importer_person.id)
      else
        {:error, reason} -> Repo.rollback(reason)
      end
    end)
  end

  defp save_failure_manifest_summary(import_run, package) do
    CompanyTransfers.update_import_run(import_run, %{
      manifest_summary: %{
        "operately_version" => package.manifest["operately_version"],
        "source_company" => package.manifest["source_company"]
      }
    })
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

  defp notify_imported_people(import_run, result) do
    PostImportNotifier.notify(result.company_id, import_run.requested_by_id, result.account_resolution, result.importer_person_id)
  rescue
    error ->
      Logger.error("Failed to send post-import notifications for import run #{import_run.id}: #{Exception.message(error)}")
      :ok
  end

  defp validation_message(errors) do
    errors
    |> Enum.map(& &1["message"])
    |> Enum.join("; ")
  end

  defp download_blob(blob, path) do
    BlobIO.download_to_path(blob, path)
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

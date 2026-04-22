defmodule Operately.CompanyTransfers.Exporter do
  alias Operately.Companies.Company
  alias Operately.CompanyTransfers
  alias Operately.CompanyTransfers.Export.{FileArchive, FileDiscovery, Manifest, RelationalCollector}
  alias Operately.CompanyTransfers.Package.PackageJson
  alias Operately.Repo

  @steps %{
    preparing_workspace: 10.0,
    collecting_rows: 35.0,
    writing_package: 70.0,
    publishing_artifacts: 90.0
  }

  def run(export_run) do
    with %Company{} = company <- Repo.get(Company, export_run.company_id),
         {:ok, export_run, workspace} <- prepare_workspace(export_run),
         {:ok, collected} <- collect_rows(export_run, company),
         file_discovery <- FileDiscovery.discover(collected.tables),
         files_count = length(file_discovery.files),
         manifest <- Manifest.build(export_run, company, collected, files_count),
         payload = build_payload(manifest, collected, file_discovery),
         :ok <- mark_progress(export_run, "writing_package", @steps.writing_package),
         json_meta <- PackageJson.write!(workspace.json_path, payload),
         :ok <- mark_progress(export_run, "publishing_artifacts", @steps.publishing_artifacts),
         zip_path <- FileArchive.create!(workspace.zip_path, file_discovery.files),
         {:ok, export_run} <- CompanyTransfers.publish_export_artifacts(export_run, %{json_path: workspace.json_path, zip_path: zip_path}),
         {:ok, export_run} <- complete_export(export_run, manifest, collected, files_count, json_meta) do
      {:ok, export_run}
    else
      nil ->
        {:error, :company_not_found}

      {:error, _reason} = error ->
        error
    end
  rescue
    error ->
      {:error, {:exception, Exception.message(error)}}
  end

  defp prepare_workspace(export_run) do
    with {:ok, export_run, workspace} <- CompanyTransfers.prepare_export_workspace(export_run),
         :ok <- mark_progress(export_run, "preparing_workspace", @steps.preparing_workspace) do
      {:ok, export_run, workspace}
    end
  end

  defp collect_rows(export_run, company) do
    :ok = mark_progress(export_run, "collecting_rows", @steps.collecting_rows)
    RelationalCollector.collect(company.id)
  end

  defp complete_export(export_run, manifest, collected, files_count, json_meta) do
    completion_attrs = %{
      current_step: "completed",
      total_steps: map_size(@steps),
      percentage: 100.0,
      current_table: nil,
      tables_count: collected.non_empty_tables_count,
      rows_count: collected.rows_count,
      files_count: files_count,
      manifest_summary: Manifest.summary(manifest, collected),
      artifacts_metadata:
        (export_run.artifacts_metadata || %{})
        |> Map.put("package", %{
          "json_sha256" => json_meta.sha256,
          "json_size_bytes" => json_meta.size_bytes,
          "zip_placeholder" => files_count == 0,
          "files_count" => files_count
        })
    }

    CompanyTransfers.mark_export_run_completed(export_run, completion_attrs)
  end

  defp build_payload(manifest, collected, file_discovery) do
    %{
      "manifest" => manifest,
      "tables" => collected.tables,
      "files" => file_discovery.files
    }
  end

  defp mark_progress(export_run, step, percentage) do
    case CompanyTransfers.update_export_run(export_run, %{
           current_step: step,
           total_steps: map_size(@steps),
           percentage: percentage
         }) do
      {:ok, _export_run} -> :ok
      {:error, reason} -> {:error, reason}
    end
  end
end

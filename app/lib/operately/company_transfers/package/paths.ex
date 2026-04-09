defmodule Operately.CompanyTransfers.Package.Paths do
  @root_segments ["operately", "company_transfers"]

  def root do
    Path.join([System.tmp_dir!() | @root_segments])
  end

  def workspaces_root do
    Path.join(root(), "workspaces")
  end

  def artifacts_root do
    Path.join(root(), "artifacts")
  end

  def workspace(:export, run_id) when is_binary(run_id) do
    Path.join([workspaces_root(), "exports", run_id])
  end

  def workspace(:import, run_id) when is_binary(run_id) do
    Path.join([workspaces_root(), "imports", run_id])
  end

  def staged_json_path(kind, run_id) when kind in [:export, :import] and is_binary(run_id) do
    Path.join(workspace(kind, run_id), "data.json")
  end

  def staged_zip_path(kind, run_id) when kind in [:export, :import] and is_binary(run_id) do
    Path.join(workspace(kind, run_id), "files.zip")
  end

  def export_artifact_dir(run_id) when is_binary(run_id) do
    Path.join(artifacts_root(), Path.dirname(export_artifact_json_key(run_id)))
  end

  def export_artifact_json_key(run_id) when is_binary(run_id) do
    Path.join(["exports", run_id, "data.json"])
  end

  def export_artifact_zip_key(run_id) when is_binary(run_id) do
    Path.join(["exports", run_id, "files.zip"])
  end

  def export_artifact_json_path(run_id) when is_binary(run_id) do
    Path.join(artifacts_root(), export_artifact_json_key(run_id))
  end

  def export_artifact_zip_path(run_id) when is_binary(run_id) do
    Path.join(artifacts_root(), export_artifact_zip_key(run_id))
  end
end

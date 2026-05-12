defmodule Operately.CompanyTransfers.Package.Paths do
  @root_segments ["operately", "company_transfers"]
  @uuid_regex ~r/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

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
    validate_run_id!(run_id)
    build_safe_workspace_path([workspaces_root(), "exports", run_id])
  end

  def workspace(:import, run_id) when is_binary(run_id) do
    validate_run_id!(run_id)
    build_safe_workspace_path([workspaces_root(), "imports", run_id])
  end

  def staged_json_path(kind, run_id) when kind in [:export, :import] and is_binary(run_id) do
    Path.join(workspace(kind, run_id), "data.json")
  end

  def staged_zip_path(kind, run_id) when kind in [:export, :import] and is_binary(run_id) do
    Path.join(workspace(kind, run_id), "operately.zip")
  end

  def export_artifact_dir(run_id) when is_binary(run_id) do
    validate_run_id!(run_id)
    build_safe_artifact_path(Path.dirname(export_artifact_json_key(run_id)))
  end

  def export_artifact_json_key(run_id) when is_binary(run_id) do
    validate_run_id!(run_id)
    Path.join(["exports", run_id, "data.json"])
  end

  def export_artifact_zip_key(run_id) when is_binary(run_id) do
    validate_run_id!(run_id)
    Path.join(["exports", run_id, "files.zip"])
  end

  def export_artifact_json_path(run_id) when is_binary(run_id) do
    validate_run_id!(run_id)
    build_safe_artifact_path(export_artifact_json_key(run_id))
  end

  def export_artifact_zip_path(run_id) when is_binary(run_id) do
    validate_run_id!(run_id)
    build_safe_artifact_path(export_artifact_zip_key(run_id))
  end

  defp validate_run_id!(run_id) do
    unless Regex.match?(@uuid_regex, run_id) do
      raise ArgumentError, "Invalid run_id format: expected UUID, got #{inspect(run_id)}"
    end
  end

  defp build_safe_workspace_path(segments) do
    candidate_path = Path.join(segments)
    expanded_path = Path.expand(candidate_path)
    workspace_root = Path.expand(workspaces_root())

    unless String.starts_with?(expanded_path, workspace_root <> "/") do
      raise ArgumentError,
            "Path traversal detected: #{inspect(candidate_path)} resolves outside workspace root"
    end

    candidate_path
  end

  defp build_safe_artifact_path(relative_path) do
    candidate_path = Path.join(artifacts_root(), relative_path)
    expanded_path = Path.expand(candidate_path)
    artifact_root = Path.expand(artifacts_root())

    unless String.starts_with?(expanded_path, artifact_root <> "/") do
      raise ArgumentError,
            "Path traversal detected: #{inspect(candidate_path)} resolves outside artifacts root"
    end

    candidate_path
  end
end

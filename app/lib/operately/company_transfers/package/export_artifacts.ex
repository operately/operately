defmodule Operately.CompanyTransfers.Package.ExportArtifacts do
  alias Operately.CompanyTransfers.Package.{Hashing, Paths}

  def publish!(run_id, %{json_path: json_path, zip_path: zip_path}) when is_binary(run_id) do
    artifact_dir = Paths.export_artifact_dir(run_id)
    artifact_json_path = Paths.export_artifact_json_path(run_id)
    artifact_zip_path = Paths.export_artifact_zip_path(run_id)

    File.rm_rf!(artifact_dir)
    File.mkdir_p!(artifact_dir)

    File.cp!(json_path, artifact_json_path)
    File.cp!(zip_path, artifact_zip_path)

    %{
      artifact_dir: artifact_dir,
      json_key: Paths.export_artifact_json_key(run_id),
      json_path: artifact_json_path,
      json_size_bytes: File.stat!(artifact_json_path).size,
      json_sha256: Hashing.sha256_file!(artifact_json_path),
      zip_key: Paths.export_artifact_zip_key(run_id),
      zip_path: artifact_zip_path,
      zip_size_bytes: File.stat!(artifact_zip_path).size,
      zip_sha256: Hashing.sha256_file!(artifact_zip_path)
    }
  end

  def delete!(run_id) when is_binary(run_id) do
    File.rm_rf!(Paths.export_artifact_dir(run_id))
    :ok
  end
end

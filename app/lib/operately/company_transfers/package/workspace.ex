defmodule Operately.CompanyTransfers.Package.Workspace do
  alias Operately.CompanyTransfers.Package.Paths

  def prepare!(kind, run_id) when kind in [:export, :import] and is_binary(run_id) do
    root_path = Paths.workspace(kind, run_id)

    File.rm_rf!(root_path)
    File.mkdir_p!(root_path)

    %{
      kind: kind,
      run_id: run_id,
      root_path: root_path,
      json_path: Paths.staged_json_path(kind, run_id),
      zip_path: Paths.staged_zip_path(kind, run_id)
    }
  end

  def cleanup!(%{root_path: root_path}), do: cleanup!(root_path)

  def cleanup!(path) when is_binary(path) do
    File.rm_rf!(path)
    :ok
  end

  def metadata(%{kind: kind, run_id: run_id, root_path: root_path, json_path: json_path, zip_path: zip_path}) do
    %{
      "kind" => Atom.to_string(kind),
      "run_id" => run_id,
      "root_path" => root_path,
      "json_path" => json_path,
      "zip_path" => zip_path
    }
  end
end

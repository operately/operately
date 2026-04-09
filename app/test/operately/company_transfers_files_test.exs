defmodule Operately.CompanyTransfersFilesTest do
  use Operately.DataCase

  alias Operately.CompanyTransfers
  alias Operately.CompanyTransfers.Package.{Archive, ExportArtifacts, Hashing, PackageJson, Paths, Workspace}

  setup do
    ctx = Factory.setup(%{})
    on_exit(fn -> File.rm_rf!(Paths.root()) end)
    {:ok, ctx}
  end

  test "prepare_export_workspace/1 stores deterministic staged paths on the run", ctx do
    assert {:ok, run} = CompanyTransfers.create_export_run(ctx.company, ctx.account, %{}, dispatch: false)
    assert {:ok, run, workspace} = CompanyTransfers.prepare_export_workspace(run)

    assert workspace.root_path == Paths.workspace(:export, run.id)
    assert workspace.json_path == Paths.staged_json_path(:export, run.id)
    assert workspace.zip_path == Paths.staged_zip_path(:export, run.id)
    assert File.dir?(workspace.root_path)

    assert run.workspace_path == workspace.root_path
    assert run.json_path == workspace.json_path
    assert run.zip_path == workspace.zip_path
    assert run.artifacts_metadata["workspace"]["kind"] == "export"
  end

  test "prepare_import_workspace/1 stores deterministic staged paths on the run", ctx do
    assert {:ok, run} = CompanyTransfers.create_import_run(ctx.account, %{}, dispatch: false)
    assert {:ok, run, workspace} = CompanyTransfers.prepare_import_workspace(run)

    assert workspace.root_path == Paths.workspace(:import, run.id)
    assert workspace.json_path == Paths.staged_json_path(:import, run.id)
    assert workspace.zip_path == Paths.staged_zip_path(:import, run.id)
    assert File.dir?(workspace.root_path)

    assert run.workspace_path == workspace.root_path
    assert run.json_path == workspace.json_path
    assert run.zip_path == workspace.zip_path
    assert run.artifacts_metadata["workspace"]["kind"] == "import"
  end

  test "package json and hashing helpers round-trip payloads and produce stable hashes" do
    path = Path.join(System.tmp_dir!(), "company_transfers_json_#{System.unique_integer([:positive])}.json")
    payload = %{"company" => %{"name" => "Acme"}, "rows" => [1, 2, 3]}

    result = PackageJson.write!(path, payload)

    assert File.exists?(path)
    assert PackageJson.read!(path) == payload
    assert result.path == path
    assert result.size_bytes > 0
    assert result.sha256 == Hashing.sha256_file!(path)
  end

  test "archive helper creates and extracts zip entries" do
    zip_path = Path.join(System.tmp_dir!(), "company_transfers_zip_#{System.unique_integer([:positive])}.zip")
    extract_path = Path.join(System.tmp_dir!(), "company_transfers_extract_#{System.unique_integer([:positive])}")

    Archive.create!(zip_path, [
      {"manifest.json", "{\"ok\":true}"},
      {"nested/hello.txt", "world"}
    ])

    extracted_files = Archive.extract!(zip_path, extract_path)

    assert File.exists?(zip_path)
    assert Path.join(extract_path, "manifest.json") in extracted_files
    assert Path.join(extract_path, "nested/hello.txt") in extracted_files
    assert File.read!(Path.join(extract_path, "nested/hello.txt")) == "world"
  end

  test "export artifacts are published under the exports run-id convention", ctx do
    assert {:ok, run} = CompanyTransfers.create_export_run(ctx.company, ctx.account, %{}, dispatch: false)
    assert {:ok, run, workspace} = CompanyTransfers.prepare_export_workspace(run)

    PackageJson.write!(workspace.json_path, %{"company" => %{"name" => ctx.company.name}})
    Archive.create!(workspace.zip_path, [])

    assert {:ok, run} = CompanyTransfers.publish_export_artifacts(run, workspace)

    assert run.json_path == Paths.export_artifact_json_path(run.id)
    assert run.zip_path == Paths.export_artifact_zip_path(run.id)
    assert run.json_size_bytes > 0
    assert run.zip_size_bytes >= 0
    assert File.exists?(run.json_path)
    assert File.exists?(run.zip_path)
    assert run.artifacts_metadata["export_artifacts"]["json_key"] == Paths.export_artifact_json_key(run.id)
    assert run.artifacts_metadata["export_artifacts"]["zip_key"] == Paths.export_artifact_zip_key(run.id)
    assert run.artifacts_metadata["workspace"]["root_path"] == workspace.root_path

    assert :ok = ExportArtifacts.delete!(run.id)
    refute File.exists?(Paths.export_artifact_dir(run.id))
  end

  test "workspace cleanup removes the temp directory" do
    workspace = Workspace.prepare!(:export, Ecto.UUID.generate())

    assert File.dir?(workspace.root_path)
    assert File.exists?(workspace.root_path)
    assert :ok = Workspace.cleanup!(workspace)
    refute File.exists?(workspace.root_path)
  end
end

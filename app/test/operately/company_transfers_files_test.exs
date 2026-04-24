defmodule Operately.CompanyTransfersFilesTest do
  use Operately.DataCase

  alias Operately.CompanyTransfers
  alias Operately.CompanyTransfers.Package.{Archive, Hashing, Limits, PackageJson, Paths, Workspace}
  alias Operately.Blobs

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
    assert run.artifacts_metadata["workspace"]["json_path"] == workspace.json_path
    assert run.artifacts_metadata["workspace"]["zip_path"] == workspace.zip_path
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
    assert run.artifacts_metadata["workspace"]["json_path"] == workspace.json_path
    assert run.artifacts_metadata["workspace"]["zip_path"] == workspace.zip_path
    assert run.artifacts_metadata["workspace"]["kind"] == "import"
  end

  test "package json and hashing helpers round-trip payloads and produce stable hashes" do
    path = Path.join(Paths.root(), "json/company_transfers_#{System.unique_integer([:positive])}.json")
    payload = %{"company" => %{"name" => "Acme"}, "rows" => [1, 2, 3]}

    result = PackageJson.write!(path, payload)

    assert File.exists?(path)
    assert PackageJson.read!(path) == payload
    assert result.path == path
    assert result.size_bytes > 0
    assert result.sha256 == Hashing.sha256_file!(path)
  end

  test "archive helper creates and extracts zip entries" do
    zip_path = Path.join(Paths.root(), "zip/company_transfers_#{System.unique_integer([:positive])}.zip")
    extract_path = Path.join(Paths.root(), "extract/company_transfers_#{System.unique_integer([:positive])}")
    source_path = Path.join(Paths.root(), "source/company_transfers_#{System.unique_integer([:positive])}.txt")

    File.mkdir_p!(Path.dirname(source_path))
    File.write!(source_path, "from file")

    Archive.create!(zip_path, [
      {"manifest.json", "{\"ok\":true}"},
      {"nested/hello.txt", "world"},
      %{path: "copied/source.txt", source_path: source_path}
    ])

    extracted_files = Archive.extract!(zip_path, extract_path)

    assert File.exists?(zip_path)
    assert Path.join(extract_path, "manifest.json") in extracted_files
    assert Path.join(extract_path, "nested/hello.txt") in extracted_files
    assert Path.join(extract_path, "copied/source.txt") in extracted_files
    assert File.read!(Path.join(extract_path, "nested/hello.txt")) == "world"
    assert File.read!(Path.join(extract_path, "copied/source.txt")) == "from file"
  end

  test "archive helper extracts only declared zip entries in strict mode" do
    zip_path = Path.join(Paths.root(), "zip/company_transfers_#{System.unique_integer([:positive])}.zip")
    extract_path = Path.join(Paths.root(), "extract/company_transfers_#{System.unique_integer([:positive])}")

    Archive.create!(zip_path, [
      {"blobs/blob-1/file.txt", "payload"}
    ])

    extracted_files = Archive.extract!(zip_path, extract_path, ["blobs/blob-1/file.txt"])

    assert extracted_files == [Path.join(extract_path, "blobs/blob-1/file.txt")]
    assert File.read!(Path.join(extract_path, "blobs/blob-1/file.txt")) == "payload"
  end

  test "archive helper rejects undeclared zip entries in strict mode" do
    zip_path = Path.join(Paths.root(), "zip/company_transfers_#{System.unique_integer([:positive])}.zip")
    extract_path = Path.join(Paths.root(), "extract/company_transfers_#{System.unique_integer([:positive])}")

    Archive.create!(zip_path, [
      {"blobs/blob-1/file.txt", "payload"},
      {"extra.txt", "not declared"}
    ])

    assert_raise ArgumentError, ~r/undeclared entries/, fn ->
      Archive.extract!(zip_path, extract_path, ["blobs/blob-1/file.txt"])
    end
  end

  test "archive helper rejects duplicate zip entries in strict mode" do
    zip_path = Path.join(Paths.root(), "zip/company_transfers_#{System.unique_integer([:positive])}.zip")
    extract_path = Path.join(Paths.root(), "extract/company_transfers_#{System.unique_integer([:positive])}")

    File.mkdir_p!(Path.dirname(zip_path))

    assert {:ok, _zip_path} =
             :zip.create(String.to_charlist(zip_path), [
               {~c"blobs/blob-1/file.txt", "first"},
               {~c"blobs/blob-1/file.txt", "second"}
             ])

    assert_raise ArgumentError, ~r/duplicate entries/, fn ->
      Archive.extract!(zip_path, extract_path, ["blobs/blob-1/file.txt"])
    end
  end

  test "archive helper rejects unsafe zip entry paths in strict mode" do
    zip_path = Path.join(Paths.root(), "zip/company_transfers_#{System.unique_integer([:positive])}.zip")
    extract_path = Path.join(Paths.root(), "extract/company_transfers_#{System.unique_integer([:positive])}")

    File.mkdir_p!(Path.dirname(zip_path))

    assert {:ok, _zip_path} =
             :zip.create(String.to_charlist(zip_path), [
               {~c"../escape.txt", "nope"}
             ])

    assert_raise ArgumentError, ~r/traversal segments/, fn ->
      Archive.extract!(zip_path, extract_path, ["blobs/blob-1/file.txt"])
    end
  end

  test "archive helper rejects oversized zip entries in strict mode" do
    zip_path = Path.join(Paths.root(), "zip/company_transfers_#{System.unique_integer([:positive])}.zip")
    extract_path = Path.join(Paths.root(), "extract/company_transfers_#{System.unique_integer([:positive])}")

    Archive.create!(zip_path, [
      {"blobs/blob-1/file.txt", "payload"}
    ])

    with_package_limits([max_extracted_file_size_bytes: 3], fn ->
      assert_raise ArgumentError, ~r/exceeds size limit/, fn ->
        Archive.extract!(zip_path, extract_path, ["blobs/blob-1/file.txt"])
      end
    end)
  end

  test "archive helper rejects missing declared zip entries in strict mode" do
    zip_path = Path.join(Paths.root(), "zip/company_transfers_#{System.unique_integer([:positive])}.zip")
    extract_path = Path.join(Paths.root(), "extract/company_transfers_#{System.unique_integer([:positive])}")

    Archive.create!(zip_path, [
      {"blobs/blob-1/file.txt", "payload"}
    ])

    assert_raise ArgumentError, ~r/missing declared entries/, fn ->
      Archive.extract!(zip_path, extract_path, ["blobs/blob-1/file.txt", "blobs/blob-2/file.txt"])
    end
  end

  test "archive helper rejects unsafe entry paths" do
    zip_path = Path.join(Paths.root(), "zip/company_transfers_#{System.unique_integer([:positive])}.zip")

    assert_raise ArgumentError, ~r/traversal segments/, fn ->
      Archive.create!(zip_path, [
        {"../escape.txt", "nope"}
      ])
    end
  end

  test "export artifacts are published to blob storage", ctx do
    assert {:ok, run} = CompanyTransfers.create_export_run(ctx.company, ctx.account, %{}, dispatch: false)
    assert {:ok, run, workspace} = CompanyTransfers.prepare_export_workspace(run)

    PackageJson.write!(workspace.json_path, %{"company" => %{"name" => ctx.company.name}})
    Archive.create!(workspace.zip_path, [])

    assert {:ok, run} = CompanyTransfers.publish_export_artifacts(run, workspace)

    # Verify blob records were created
    assert run.json_blob_id != nil
    assert run.zip_blob_id != nil
    assert run.json_size_bytes > 0
    assert run.zip_size_bytes >= 0

    # Verify blobs have correct properties
    json_blob = Blobs.get_blob!(run.json_blob_id)
    assert json_blob.company_id == ctx.company.id
    assert json_blob.status == :uploaded
    assert json_blob.content_type == "application/json"
    assert json_blob.size == run.json_size_bytes

    zip_blob = Blobs.get_blob!(run.zip_blob_id)
    assert zip_blob.company_id == ctx.company.id
    assert zip_blob.status == :uploaded
    assert zip_blob.content_type == "application/zip"
    assert zip_blob.size == run.zip_size_bytes

    # Verify files were uploaded to storage
    json_storage_path = "/media/#{Operately.Blobs.Blob.path(json_blob)}"
    zip_storage_path = "/media/#{Operately.Blobs.Blob.path(zip_blob)}"
    assert File.exists?(json_storage_path)
    assert File.exists?(zip_storage_path)

    # Cleanup
    File.rm(json_storage_path)
    File.rm(zip_storage_path)
  end

  test "workspace cleanup removes the temp directory" do
    workspace = Workspace.prepare!(:export, Ecto.UUID.generate())

    assert File.dir?(workspace.root_path)
    assert File.exists?(workspace.root_path)
    assert :ok = Workspace.cleanup!(workspace)
    refute File.exists?(workspace.root_path)
  end

  defp with_package_limits(limits, fun) do
    original = Application.get_env(:operately, Limits)
    Application.put_env(:operately, Limits, limits)

    try do
      fun.()
    after
      if original == nil do
        Application.delete_env(:operately, Limits)
      else
        Application.put_env(:operately, Limits, original)
      end
    end
  end
end

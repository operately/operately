defmodule Operately.CompanyTransfers.Export.FileArchiveTest do
  use Operately.DataCase

  import Operately.BlobsFixtures

  alias Operately.Blobs.Blob
  alias Operately.CompanyTransfers.BlobIO
  alias Operately.CompanyTransfers.Export.FileArchive
  alias Operately.CompanyTransfers.Package.Archive

  setup do
    Application.put_env(:operately, :storage_type, "local")
    {:ok, Factory.setup(%{})}
  end

  test "create!/2 skips blobs whose storage file is missing", ctx do
    present_blob = blob_fixture(%{company_id: ctx.company.id, author_id: ctx.creator.id})
    missing_blob = blob_fixture(%{company_id: ctx.company.id, author_id: ctx.creator.id})

    source_path = temp_path("file-archive-source.txt")
    File.write!(source_path, "present content")

    on_exit(fn ->
      cleanup_paths([source_path, storage_path(present_blob)])
    end)

    assert {:ok, _} = BlobIO.upload_to_blob(present_blob, source_path)

    zip_path = temp_path("file-archive-skip.zip")
    extract_dir = temp_path("file-archive-skip-extract")

    on_exit(fn -> cleanup_paths([zip_path, extract_dir]) end)

    files = [
      %{"blob_id" => present_blob.id, "path" => "blobs/#{present_blob.id}/#{present_blob.filename}"},
      %{"blob_id" => missing_blob.id, "path" => "blobs/#{missing_blob.id}/#{missing_blob.filename}"}
    ]

    assert ^zip_path = FileArchive.create!(zip_path, files)

    extracted = Archive.extract!(zip_path, extract_dir)

    assert Path.join(extract_dir, "blobs/#{present_blob.id}/#{present_blob.filename}") in extracted
    refute Path.join(extract_dir, "blobs/#{missing_blob.id}/#{missing_blob.filename}") in extracted
  end

  test "create!/2 succeeds when all blob storage files are missing", ctx do
    blob = blob_fixture(%{company_id: ctx.company.id, author_id: ctx.creator.id})

    zip_path = temp_path("file-archive-all-missing.zip")

    on_exit(fn -> cleanup_paths([zip_path]) end)

    files = [%{"blob_id" => blob.id, "path" => "blobs/#{blob.id}/#{blob.filename}"}]

    assert ^zip_path = FileArchive.create!(zip_path, files)
    assert File.exists?(zip_path)
  end

  defp temp_path(name) do
    Path.join(System.tmp_dir!(), "#{System.unique_integer([:positive])}-#{name}")
  end

  defp storage_path(%Blob{} = blob) do
    Path.join("/media", Blob.path(blob))
  end

  defp cleanup_paths(paths) do
    Enum.each(paths, fn path ->
      if File.exists?(path), do: File.rm_rf!(path)
    end)
  end
end

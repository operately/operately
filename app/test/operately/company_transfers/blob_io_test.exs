defmodule Operately.CompanyTransfers.BlobIOTest do
  use Operately.DataCase

  alias Operately.Blobs.Blob
  alias Operately.CompanyTransfers.BlobIO

  import Operately.BlobsFixtures

  setup do
    Application.put_env(:operately, :storage_type, "local")
    {:ok, Factory.setup(%{})}
  end

  test "create_and_upload_company_file/4 stores a staged file as an uploaded blob", ctx do
    source_path = temp_path("blob-io-upload-source.txt")
    File.write!(source_path, "blob io upload content")

    assert {:ok, blob} = BlobIO.create_and_upload_company_file(ctx.company, ctx.creator, source_path, "text/plain")

    on_exit(fn ->
      cleanup_paths([source_path, storage_path(blob)])
    end)

    assert blob.company_id == ctx.company.id
    assert blob.author_id == ctx.creator.id
    assert blob.status == :uploaded
    assert blob.content_type == "text/plain"
    assert File.read!(storage_path(blob)) == "blob io upload content"
  end

  test "upload_to_blob/2 writes to an existing blob and marks it uploaded", ctx do
    source_path = temp_path("blob-io-existing-source.txt")
    File.write!(source_path, "existing blob content")

    blob = blob_fixture(%{company_id: ctx.company.id, author_id: ctx.creator.id})

    on_exit(fn ->
      cleanup_paths([source_path, storage_path(blob)])
    end)

    assert {:ok, uploaded_blob} = BlobIO.upload_to_blob(blob, source_path)

    assert uploaded_blob.id == blob.id
    assert uploaded_blob.status == :uploaded
    assert File.read!(storage_path(uploaded_blob)) == "existing blob content"
  end

  test "download_to_path/2 copies a blob into a destination file", ctx do
    source_path = temp_path("blob-io-download-source.txt")
    dest_path = temp_path("blob-io-download-dest.txt")
    File.write!(source_path, "blob io download content")

    assert {:ok, blob} = BlobIO.create_and_upload_company_file(ctx.company, ctx.creator, source_path, "text/plain")

    on_exit(fn ->
      cleanup_paths([source_path, dest_path, storage_path(blob)])
    end)

    assert :ok = BlobIO.download_to_path(blob, dest_path)
    assert File.read!(dest_path) == "blob io download content"
  end

  defp storage_path(%Blob{} = blob) do
    "/media/#{Blob.path(blob)}"
  end

  defp temp_path(filename) do
    Path.join(System.tmp_dir!(), "#{System.unique_integer([:positive])}-#{filename}")
  end

  defp cleanup_paths(paths) do
    Enum.each(paths, fn path ->
      if File.exists?(path), do: File.rm_rf!(path)
    end)
  end
end

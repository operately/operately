defmodule Operately.Blobs.UploadDownloadTest do
  use Operately.DataCase

  alias Operately.Blobs
  alias Operately.Support.Factory

  import Operately.BlobsFixtures

  setup do
    Factory.setup(%{})
  end

  describe "upload_file_to_blob/4 with local storage" do
    setup do
      # Ensure local storage is configured
      Application.put_env(:operately, :storage_type, "local")

      # Create a temporary test file
      test_file_path = Path.join(System.tmp_dir!(), "test_upload_#{:rand.uniform(10000)}.txt")
      File.write!(test_file_path, "Test content for upload")

      on_exit(fn ->
        File.rm(test_file_path)
      end)

      {:ok, test_file_path: test_file_path}
    end

    test "creates blob record and uploads file to local storage", ctx do
      {:ok, blob} = Blobs.upload_file_to_blob(
        ctx.company,
        ctx.creator,
        ctx.test_file_path,
        "text/plain"
      )

      # Verify blob record was created
      assert blob.company_id == ctx.company.id
      assert blob.author_id == ctx.creator.id
      assert blob.status == :uploaded
      assert blob.storage_type == :local
      assert blob.filename == Path.basename(ctx.test_file_path)
      assert blob.content_type == "text/plain"
      assert blob.size > 0

      # Verify file was uploaded to storage
      storage_path = "/media/#{Operately.Blobs.Blob.path(blob)}"
      assert File.exists?(storage_path)
      assert File.read!(storage_path) == "Test content for upload"

      # Cleanup
      File.rm(storage_path)
    end

    test "handles different content types", ctx do
      {:ok, blob} = Blobs.upload_file_to_blob(
        ctx.company,
        ctx.creator,
        ctx.test_file_path,
        "application/json"
      )

      assert blob.content_type == "application/json"

      # Cleanup
      storage_path = "/media/#{Operately.Blobs.Blob.path(blob)}"
      File.rm(storage_path)
    end
  end

  describe "download_blob_to_file/2 with local storage" do
    setup ctx do
      # Ensure local storage is configured
      Application.put_env(:operately, :storage_type, "local")

      # Create a blob and upload a test file
      test_content = "Test content for download"
      test_file_path = Path.join(System.tmp_dir!(), "test_source_#{:rand.uniform(10000)}.txt")
      File.write!(test_file_path, test_content)

      {:ok, blob} = Blobs.upload_file_to_blob(
        ctx.company,
        ctx.creator,
        test_file_path,
        "text/plain"
      )

      dest_path = Path.join(System.tmp_dir!(), "test_download_#{:rand.uniform(10000)}.txt")

      on_exit(fn ->
        File.rm(test_file_path)
        if File.exists?(dest_path), do: File.rm(dest_path)

        storage_path = "/media/#{Operately.Blobs.Blob.path(blob)}"
        if File.exists?(storage_path), do: File.rm(storage_path)
      end)

      {:ok, blob: blob, dest_path: dest_path, test_content: test_content}
    end

    test "downloads file from local storage", ctx do
      assert :ok = Blobs.download_blob_to_file(ctx.blob, ctx.dest_path)

      # Verify file was downloaded
      assert File.exists?(ctx.dest_path)
      assert File.read!(ctx.dest_path) == ctx.test_content
    end

    test "returns error when blob file doesn't exist", ctx do
      # Delete the storage file
      storage_path = "/media/#{Operately.Blobs.Blob.path(ctx.blob)}"
      File.rm!(storage_path)

      assert {:error, _reason} = Blobs.download_blob_to_file(ctx.blob, ctx.dest_path)
    end
  end

  describe "Blob.path/1" do
    test "generates correct storage path pattern", ctx do
      blob = blob_fixture(company_id: ctx.company.id, author_id: ctx.creator.id)

      path = Operately.Blobs.Blob.path(blob)

      assert path == "#{blob.company_id}-#{blob.id}"
      assert String.contains?(path, "-")
      # Should be two UUIDs joined
      assert String.length(path) > 10
    end

    test "uses account-scoped paths for import artifacts", ctx do
      blob = blob_fixture(%{
        purpose: :company_transfer_import_artifact,
        account_id: ctx.account.id,
        author_id: nil,
        company_id: nil
      })

      path = Operately.Blobs.Blob.path(blob)

      assert path == "company-transfer-import-artifacts/#{ctx.account.id}/#{blob.id}"
    end

    test "path is consistent across multiple calls", ctx do
      blob = blob_fixture(company_id: ctx.company.id, author_id: ctx.creator.id)

      path1 = Operately.Blobs.Blob.path(blob)
      path2 = Operately.Blobs.Blob.path(blob)

      assert path1 == path2
    end
  end
end

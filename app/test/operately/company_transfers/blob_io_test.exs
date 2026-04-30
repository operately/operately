defmodule Operately.CompanyTransfers.BlobIOTest do
  use Operately.DataCase

  alias Operately.Blobs.Blob
  alias Operately.CompanyTransfers.BlobIO

  import Mock
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

  describe "with s3-compatible storage" do
    setup do
      previous_storage_type = Application.get_env(:operately, :storage_type)
      previous_env = Map.new(s3_env(), fn {key, _value} -> {key, System.get_env(key)} end)

      Application.put_env(:operately, :storage_type, "s3")
      Enum.each(s3_env(), fn {key, value} -> System.put_env(key, value) end)

      on_exit(fn ->
        restore_app_env(:operately, :storage_type, previous_storage_type)
        Enum.each(previous_env, fn {key, value} -> restore_system_env(key, value) end)
      end)

      :ok
    end

    test "create_and_upload_company_file/4 uploads through the S3 HTTP wrapper", ctx do
      source_path = temp_path("blob-io-s3-upload-source.txt")
      File.write!(source_path, "blob io upload content")

      expected_headers = [
        {"Content-Type", "text/plain"},
        {"Content-Length", Integer.to_string(File.stat!(source_path).size)}
      ]

      on_exit(fn ->
        cleanup_paths([source_path])
      end)

      with_mock Operately.Blobs.S3Http,
        put_file: fn path, incoming_source_path, headers ->
          send(self(), {:put_file, path, incoming_source_path, headers})
          :ok
        end do
        assert {:ok, blob} = BlobIO.create_and_upload_company_file(ctx.company, ctx.creator, source_path, "text/plain")

        assert blob.storage_type == :s3
        assert blob.status == :uploaded

        assert_received {:put_file, path, ^source_path, headers}
        assert path == Blob.path(blob)
        assert headers == expected_headers
      end
    end

    test "upload_to_blob/2 uploads through the S3 HTTP wrapper", ctx do
      source_path = temp_path("blob-io-s3-existing-source.txt")
      File.write!(source_path, "existing blob content")
      blob = blob_fixture(%{company_id: ctx.company.id, author_id: ctx.creator.id})

      expected_headers = [
        {"Content-Type", blob.content_type},
        {"Content-Length", Integer.to_string(File.stat!(source_path).size)}
      ]

      on_exit(fn ->
        cleanup_paths([source_path])
      end)

      with_mock Operately.Blobs.S3Http,
        put_file: fn path, incoming_source_path, headers ->
          send(self(), {:put_file, path, incoming_source_path, headers})
          :ok
        end do
        assert {:ok, uploaded_blob} = BlobIO.upload_to_blob(blob, source_path)

        assert uploaded_blob.id == blob.id
        assert uploaded_blob.status == :uploaded

        assert_received {:put_file, path, ^source_path, headers}
        assert path == Blob.path(blob)
        assert headers == expected_headers
      end
    end

    test "download_to_path/2 downloads through the S3 HTTP wrapper", ctx do
      blob = blob_fixture(%{company_id: ctx.company.id, author_id: ctx.creator.id})
      dest_path = temp_path("blob-io-s3-download-dest.txt")

      on_exit(fn ->
        cleanup_paths([dest_path])
      end)

      with_mock Operately.Blobs.S3Http,
        download_to_file: fn path, incoming_dest_path ->
          send(self(), {:download_to_file, path, incoming_dest_path})
          File.write!(incoming_dest_path, "blob io download content")
          :ok
        end do
        assert :ok = BlobIO.download_to_path(blob, dest_path)

        assert_received {:download_to_file, path, ^dest_path}
        assert path == Blob.path(blob)
        assert File.read!(dest_path) == "blob io download content"
      end
    end

    test "delete/1 deletes through the S3 HTTP wrapper", ctx do
      blob = blob_fixture(%{company_id: ctx.company.id, author_id: ctx.creator.id})

      with_mock Operately.Blobs.S3Http,
        delete_object: fn path ->
          send(self(), {:delete_object, path})
          :ok
        end do
        assert :ok = BlobIO.delete(blob)

        assert_received {:delete_object, path}
        assert path == Blob.path(blob)
      end
    end
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

  defp s3_env do
    [
      {"OPERATELY_STORAGE_S3_HOST", "localhost"},
      {"OPERATELY_STORAGE_S3_SCHEME", "http"},
      {"OPERATELY_STORAGE_S3_PORT", "9000"},
      {"OPERATELY_STORAGE_S3_BUCKET", "test-bucket"},
      {"OPERATELY_STORAGE_S3_REGION", "us-east-1"},
      {"OPERATELY_STORAGE_S3_ACCESS_KEY_ID", "test-access-key"},
      {"OPERATELY_STORAGE_S3_SECRET_ACCESS_KEY", "test-secret-key"}
    ]
  end

  defp restore_app_env(app, key, nil), do: Application.delete_env(app, key)
  defp restore_app_env(app, key, value), do: Application.put_env(app, key, value)

  defp restore_system_env(key, nil), do: System.delete_env(key)
  defp restore_system_env(key, value), do: System.put_env(key, value)
end

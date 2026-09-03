defmodule Operately.CompanyTransfers.Import.FileImporterTest do
  use Operately.DataCase

  import Mock
  import Operately.BlobsFixtures

  alias Operately.Blobs.Blob
  alias Operately.CompanyTransfers.BlobIO
  alias Operately.CompanyTransfers.Import.{FileImporter, Package}

  setup do
    {:ok, Factory.setup(%{})}
  end

  test "import/3 skips files whose payload is missing from the package", ctx do
    first_blob = blob_fixture(%{company_id: ctx.company.id, author_id: ctx.creator.id})
    second_blob = blob_fixture(%{company_id: ctx.company.id, author_id: ctx.creator.id})

    files_root = Path.join(System.tmp_dir!(), "company-transfer-files-#{System.unique_integer([:positive])}")
    first_path = Path.join(files_root, "blobs/source-1/one.txt")

    File.mkdir_p!(Path.dirname(first_path))
    File.write!(first_path, "first payload")

    package = %Package{
      manifest: %{},
      tables: [],
      table_map: %{},
      files: [
        %{"blob_id" => "source-1", "path" => "blobs/source-1/one.txt"},
        %{"blob_id" => "source-2", "path" => "blobs/source-2/two.txt"}
      ]
    }

    blob_id_map = %{
      "source-1" => first_blob.id,
      "source-2" => second_blob.id
    }

    assert {:ok, 1} = FileImporter.import(package, files_root, blob_id_map)

    assert File.exists?(storage_path(first_blob))
  end

  test "import/3 preserves a typed error when a file upload fails", ctx do
    blob = blob_fixture(%{company_id: ctx.company.id, author_id: ctx.creator.id})
    files_root = Path.join(System.tmp_dir!(), "company-transfer-files-#{System.unique_integer([:positive])}")
    source_path = Path.join(files_root, "blobs/source-1/file.txt")

    File.mkdir_p!(Path.dirname(source_path))
    File.write!(source_path, "payload")
    on_exit(fn -> File.rm_rf!(files_root) end)

    package = %Package{
      manifest: %{},
      tables: [],
      table_map: %{},
      files: [%{"blob_id" => "source-1", "path" => "blobs/source-1/file.txt"}]
    }

    with_mock BlobIO, upload_to_blob: fn ^blob, ^source_path -> {:error, :timeout} end do
      assert {:error, {:file_upload_failed, "source-1", :timeout}} = FileImporter.import(package, files_root, %{"source-1" => blob.id})
    end
  end

  defp storage_path(%Blob{} = blob) do
    Path.join("/media", Blob.path(blob))
  end
end

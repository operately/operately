defmodule Operately.CompanyTransfers.Import.FileImporterTest do
  use Operately.DataCase

  import Operately.BlobsFixtures

  alias Operately.Blobs.Blob
  alias Operately.CompanyTransfers.Import.{FileImporter, Package}

  setup do
    {:ok, Factory.setup(%{})}
  end

  test "import/3 cleans up already-uploaded files when a later payload is missing", ctx do
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

    assert {:error, {:missing_file_payload, "blobs/source-2/two.txt"}} =
             FileImporter.import(package, files_root, blob_id_map)

    refute File.exists?(storage_path(first_blob))
  end

  defp storage_path(%Blob{} = blob) do
    Path.join("/media", Blob.path(blob))
  end
end

defmodule Operately.CompanyTransfers.Export.FileDiscoveryTest do
  use Operately.DataCase

  alias Operately.Blobs
  alias Operately.Blobs.Blob
  alias Operately.CompanyTransfers.BlobIO
  alias Operately.CompanyTransfers.Export.FileDiscovery
  alias Operately.CompanyTransfers.Package.Paths, as: PackagePaths
  alias Operately.Repo
  alias Operately.ResourceHubs.File, as: ResourceHubFile
  alias Operately.Support.CompanyTransfer.Helpers, as: Transfers
  alias OperatelyWeb.Paths, as: WebPaths

  setup do
    on_exit(fn -> File.rm_rf!(PackagePaths.root()) end)
    {:ok, Factory.setup(%{})}
  end

  test "discover/1 finds referenced blob payloads and blob references in exported rows", ctx do
    ctx =
      ctx
      |> Factory.add_blob(:avatar_blob)
      |> Factory.add_blob(:embedded_blob)
      |> Factory.add_blob(:preview_blob)
      |> Factory.add_blob(:unused_blob)
      |> Factory.add_space(:space)
      |> Factory.add_resource_hub(:hub, :space, :creator)

    ctx =
      ctx
      |> Factory.add_document(:document, :hub, content: blob_document(ctx.embedded_blob))
      |> Factory.add_file(:file, :hub)

    {:ok, creator} =
      Operately.People.update_person(ctx.creator, %{
        avatar_blob_id: ctx.avatar_blob.id,
        avatar_url: Operately.Blobs.Blob.url(ctx.avatar_blob)
      })

    {:ok, file} =
      ctx.file
      |> ResourceHubFile.changeset(%{preview_blob_id: ctx.preview_blob.id})
      |> Repo.update()

    ctx =
      ctx
      |> Map.put(:creator, creator)
      |> Map.put(:file, file)

    file_blob = Blobs.get_blob!(ctx.file.blob_id)

    on_exit(fn ->
      cleanup_blob_storage([ctx.avatar_blob, ctx.embedded_blob, ctx.preview_blob, file_blob])
    end)

    upload_blob_payload!(ctx.avatar_blob, "avatar payload")
    upload_blob_payload!(ctx.embedded_blob, "embedded payload")
    upload_blob_payload!(ctx.preview_blob, "preview payload")
    upload_blob_payload!(file_blob, "resource file payload")

    package = Transfers.export!(ctx.company, ctx.account).package
    discovery = FileDiscovery.discover(package)

    assert MapSet.new(discovery.files) ==
             MapSet.new([
               file_entry(ctx.avatar_blob),
               file_entry(ctx.embedded_blob),
               file_entry(find_blob!(package, ctx.file.blob_id)),
               file_entry(ctx.preview_blob)
             ])

    assert %{table: "people", row_id: ctx.creator.id, column: "avatar_blob_id", blob_id: ctx.avatar_blob.id} in discovery.direct_blob_references
    assert %{table: "resource_files", row_id: ctx.file.id, column: "blob_id", blob_id: ctx.file.blob_id} in discovery.direct_blob_references
    assert %{table: "resource_files", row_id: ctx.file.id, column: "preview_blob_id", blob_id: ctx.preview_blob.id} in discovery.direct_blob_references

    version = Operately.ResourceHubs.DocumentVersion.get_by_document_and_number(ctx.document.id, 1)

    assert MapSet.new(discovery.rich_text_blob_references) ==
             MapSet.new([
               %{table: "resource_documents", row_id: ctx.document.id, column: "content", blob_id: ctx.embedded_blob.id},
               %{table: "resource_document_versions", row_id: version.id, column: "content", blob_id: ctx.embedded_blob.id}
             ])

    refute Enum.any?(discovery.files, &(&1["blob_id"] == ctx.unused_blob.id))
  end

  test "discover/1 finds blobs referenced only by historical document versions", ctx do
    ctx =
      ctx
      |> Factory.add_blob(:historical_blob)
      |> Factory.add_space(:space)
      |> Factory.add_resource_hub(:hub, :space, :creator)
      |> Factory.add_document(:document, :hub, content: %{"type" => "doc", "content" => []})

    version = Operately.ResourceHubs.DocumentVersion.get_by_document_and_number(ctx.document.id, 1)

    assert {:ok, _version} =
             version
             |> Ecto.Changeset.change(%{content: blob_document(ctx.historical_blob)})
             |> Repo.update()

    on_exit(fn ->
      cleanup_blob_storage([ctx.historical_blob])
    end)

    upload_blob_payload!(ctx.historical_blob, "historical payload")

    package = Transfers.export!(ctx.company, ctx.account).package
    discovery = FileDiscovery.discover(package)

    assert Enum.any?(discovery.files, &(&1["blob_id"] == ctx.historical_blob.id))

    assert %{
             table: "resource_document_versions",
             row_id: _version_id,
             column: "content",
             blob_id: historical_blob_id
           } =
             Enum.find(discovery.rich_text_blob_references, &(&1.blob_id == ctx.historical_blob.id))

    assert historical_blob_id == ctx.historical_blob.id
  end

  defp blob_document(blob) do
    %{
      "type" => "doc",
      "content" => [
        %{
          "type" => "blob",
          "attrs" => %{
            "id" => WebPaths.blob_id(blob),
            "src" => Operately.Blobs.Blob.url(blob),
            "title" => blob.filename,
            "filetype" => blob.content_type
          }
        }
      ]
    }
  end

  defp file_entry(blob) do
    %{
      "blob_id" => blob_id(blob),
      "path" => Path.join(["blobs", blob_id(blob), blob_filename(blob)])
    }
  end

  defp blob_id(%{"id" => id}), do: id
  defp blob_id(%{id: id}), do: id

  defp blob_filename(%{"filename" => filename}), do: filename
  defp blob_filename(%{filename: filename}), do: filename

  defp find_blob!(package, blob_id) do
    package["tables"]
    |> Enum.find(&(&1["name"] == "blobs"))
    |> Map.get("rows", [])
    |> Enum.find(&(&1["id"] == blob_id))
    |> case do
      nil -> raise "Blob #{inspect(blob_id)} not found in package"
      blob -> blob
    end
  end

  defp upload_blob_payload!(blob, content) do
    source_path = Path.join(System.tmp_dir!(), "blob-payload-#{blob.id}")
    File.write!(source_path, content)
    assert {:ok, _blob} = BlobIO.upload_to_blob(blob, source_path)
    File.rm!(source_path)
  end

  defp cleanup_blob_storage(blobs) do
    Enum.each(blobs, fn blob ->
      _ = File.rm(storage_path(blob))
    end)
  end

  defp storage_path(%Blob{} = blob) do
    Path.join("/media", Blob.path(blob))
  end
end

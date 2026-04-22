defmodule Operately.CompanyTransfers.ExporterTest do
  use Operately.DataCase

  alias Operately.CompanyTransfers
  alias Operately.CompanyTransfers.BlobIO
  alias Operately.CompanyTransfers.{ExportRun, Exporter}
  alias Operately.CompanyTransfers.Package.{Archive, PackageJson, Paths}
  alias Operately.Blobs
  alias Operately.Blobs.Blob
  alias Operately.Repo
  alias Operately.ResourceHubs.File, as: ResourceHubFile
  alias OperatelyWeb.Paths, as: WebPaths

  setup do
    on_exit(fn -> File.rm_rf!(Paths.root()) end)
    {:ok, Factory.setup(%{})}
  end

  test "run/1 completes the export and persists artifact metadata", ctx do
    ctx =
      ctx
      |> Factory.add_space(:space)
      |> Factory.add_project(:project, :space)
      |> Factory.add_company_member(:member)

    ctx =
      ctx
      |> Factory.add_subscription(:subscription, :project, person: ctx.member)
      |> Factory.add_api_token(:raw_token, :creator)

    assert {:ok, run} = CompanyTransfers.create_export_run(ctx.company, ctx.account, %{}, dispatch: false)
    assert {:ok, run} = CompanyTransfers.mark_export_run_running(run)
    assert {:ok, completed_run} = Exporter.run(run)

    # Download blob to read package
    completed_run = Repo.preload(completed_run, :json_blob)
    temp_path = Path.join(System.tmp_dir!(), "export_test_#{completed_run.id}.json")
    :ok = Operately.Blobs.download_blob_to_file(completed_run.json_blob, temp_path)
    package = PackageJson.read!(temp_path)
    File.rm!(temp_path)
    tables = Map.new(package["tables"], &{&1["name"], &1})

    assert completed_run.status == :completed
    assert completed_run.started_at != nil
    assert completed_run.completed_at != nil
    assert completed_run.error_message == nil
    assert completed_run.current_step == "completed"
    assert completed_run.percentage == 100.0
    assert completed_run.total_steps == 4
    assert completed_run.files_count == 0
    assert completed_run.rows_count == package["manifest"]["rows_count"]
    assert completed_run.tables_count == package["manifest"]["tables_count"]

    assert completed_run.json_blob_id != nil
    assert completed_run.zip_blob_id != nil
    assert completed_run.json_size_bytes > 0
    assert completed_run.zip_size_bytes > 0

    assert package["files"] == []
    assert package["manifest"]["slice"] == "relational_minimal"
    assert package["manifest"]["source_company"]["id"] == ctx.company.id
    assert package["manifest"]["requested_by_id"] == ctx.account.id
    assert ctx.project.id in Enum.map(tables["projects"]["rows"], & &1["id"])
    assert ctx.subscription.id in Enum.map(tables["subscriptions"]["rows"], & &1["id"])

    # api_tokens is now excluded from export
    refute Map.has_key?(tables, "api_tokens")

    assert completed_run.manifest_summary["source_company"] == package["manifest"]["source_company"]
    assert completed_run.manifest_summary["tables_count"] == package["manifest"]["tables_count"]
    assert completed_run.manifest_summary["rows_count"] == package["manifest"]["rows_count"]

    assert completed_run.artifacts_metadata["workspace"]["run_id"] == run.id
    assert completed_run.artifacts_metadata["package"]["zip_placeholder"] == true
    assert completed_run.artifacts_metadata["package"]["json_size_bytes"] == completed_run.json_size_bytes
  end

  test "run/1 writes a placeholder zip artifact", ctx do
    assert {:ok, run} = CompanyTransfers.create_export_run(ctx.company, ctx.account, %{}, dispatch: false)
    assert {:ok, run} = CompanyTransfers.mark_export_run_running(run)
    assert {:ok, completed_run} = Exporter.run(run)

    # Download zip blob to extract
    completed_run = Repo.preload(completed_run, :zip_blob)
    temp_zip_path = Path.join(System.tmp_dir!(), "export_test_#{completed_run.id}.zip")
    :ok = Operately.Blobs.download_blob_to_file(completed_run.zip_blob, temp_zip_path)

    extract_dir = Path.join(Paths.root(), "extract-#{Ecto.UUID.generate()}")
    extracted_paths = Archive.extract!(temp_zip_path, extract_dir)
    readme_path = Path.join(extract_dir, "README.txt")

    assert readme_path in extracted_paths
    assert File.read!(readme_path) == "No files are included in this export yet.\n"

    # Cleanup
    File.rm!(temp_zip_path)
  end

  test "run/1 writes discovered file entries into the package and manifest", ctx do
    ctx =
      ctx
      |> Factory.add_blob(:avatar_blob)
      |> Factory.add_blob(:embedded_blob)
      |> Factory.add_blob(:preview_blob)
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

    assert {:ok, run} = CompanyTransfers.create_export_run(ctx.company, ctx.account, %{}, dispatch: false)
    assert {:ok, run} = CompanyTransfers.mark_export_run_running(run)
    assert {:ok, completed_run} = Exporter.run(run)

    completed_run = Repo.preload(completed_run, :json_blob)
    temp_path = Path.join(System.tmp_dir!(), "export_test_#{completed_run.id}.json")
    :ok = Operately.Blobs.download_blob_to_file(completed_run.json_blob, temp_path)
    package = PackageJson.read!(temp_path)
    File.rm!(temp_path)

    assert MapSet.new(package["files"]) ==
             MapSet.new([
               file_entry(ctx.avatar_blob),
               file_entry(ctx.embedded_blob),
               file_entry(find_blob!(package, ctx.file.blob_id)),
               file_entry(ctx.preview_blob)
             ])

    assert completed_run.files_count == 4
    assert package["manifest"]["files_count"] == 4
    assert completed_run.artifacts_metadata["package"]["files_count"] == 4
    assert completed_run.manifest_summary["files_count"] == 4
    assert completed_run.artifacts_metadata["package"]["zip_placeholder"] == false
  end

  test "run/1 writes referenced blob payloads into the zip artifact", ctx do
    ctx =
      ctx
      |> Factory.add_blob(:embedded_blob)
      |> Factory.add_space(:space)
      |> Factory.add_resource_hub(:hub, :space, :creator)

    ctx =
      ctx
      |> Factory.add_document(:document, :hub, content: blob_document(ctx.embedded_blob))

    on_exit(fn ->
      cleanup_blob_storage([ctx.embedded_blob])
    end)

    upload_blob_payload!(ctx.embedded_blob, "embedded payload")

    assert {:ok, run} = CompanyTransfers.create_export_run(ctx.company, ctx.account, %{}, dispatch: false)
    assert {:ok, run} = CompanyTransfers.mark_export_run_running(run)
    assert {:ok, completed_run} = Exporter.run(run)

    completed_run = Repo.preload(completed_run, :zip_blob)
    temp_zip_path = Path.join(System.tmp_dir!(), "export_test_payloads_#{completed_run.id}.zip")
    :ok = Operately.Blobs.download_blob_to_file(completed_run.zip_blob, temp_zip_path)

    extract_dir = Path.join(Paths.root(), "extract-#{Ecto.UUID.generate()}")
    extracted_paths = Archive.extract!(temp_zip_path, extract_dir)

    embedded_path = Path.join(extract_dir, Path.join(["blobs", ctx.embedded_blob.id, ctx.embedded_blob.filename]))

    assert embedded_path in extracted_paths
    assert File.read!(embedded_path) == "embedded payload"

    File.rm!(temp_zip_path)
  end

  test "run/1 returns company_not_found when the source company does not exist", ctx do
    missing_run = %ExportRun{
      id: Ecto.UUID.generate(),
      company_id: Ecto.UUID.generate(),
      requested_by_id: ctx.account.id
    }

    assert Exporter.run(missing_run) == {:error, :company_not_found}
  end

  test "run/1 wraps unexpected exceptions", ctx do
    invalid_run = %ExportRun{
      id: "not-a-uuid",
      company_id: ctx.company.id,
      requested_by_id: ctx.account.id
    }

    assert {:error, {:exception, message}} = Exporter.run(invalid_run)
    assert message =~ "Invalid run_id format"
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

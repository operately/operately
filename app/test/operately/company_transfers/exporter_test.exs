defmodule Operately.CompanyTransfers.ExporterTest do
  use Operately.DataCase

  alias Operately.CompanyTransfers
  alias Operately.CompanyTransfers.{ExportRun, Exporter}
  alias Operately.CompanyTransfers.Package.{Archive, PackageJson, Paths}
  alias Operately.Repo

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
end

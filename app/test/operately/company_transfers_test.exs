defmodule Operately.CompanyTransfersTest do
  use Operately.DataCase
  use Oban.Testing, repo: Operately.Repo

  alias Operately.CompanyTransfers
  alias Operately.CompanyTransfers.{ExportRun, ExportWorker, ImportRun, ImportWorker}

  setup do
    {:ok, Factory.setup(%{})}
  end

  test "create_export_run/2 persists the export run foundation", ctx do
    attrs = %{
      current_step: "collecting_tables",
      total_steps: 5,
      percentage: 20.0,
      current_table: "companies",
      validation_errors: [%{"table" => "projects", "message" => "skipped for now"}],
      manifest_summary: %{"company_name" => ctx.company.name},
      artifacts_metadata: %{"workspace" => "tmp/export-run"},
      workspace_path: "/tmp/export-run",
      json_path: "/tmp/export-run/data.json",
      zip_path: "/tmp/export-run/files.zip"
    }

    assert {:ok, %ExportRun{} = run} = CompanyTransfers.create_export_run(ctx.company, ctx.account, attrs, dispatch: false)

    assert run.company_id == ctx.company.id
    assert run.requested_by_id == ctx.account.id
    assert run.status == :pending
    assert run.current_step == "collecting_tables"
    assert run.total_steps == 5
    assert run.percentage == 20.0
    assert run.current_table == "companies"
    assert run.validation_errors == [%{"table" => "projects", "message" => "skipped for now"}]
    assert run.manifest_summary == %{"company_name" => ctx.company.name}
    assert run.artifacts_metadata == %{"workspace" => "tmp/export-run"}
    assert run.workspace_path == "/tmp/export-run"
    assert run.json_path == "/tmp/export-run/data.json"
    assert run.zip_path == "/tmp/export-run/files.zip"
    assert run.started_at == nil
    assert run.completed_at == nil
  end

  test "create_import_run/2 persists the import run foundation", ctx do
    attrs = %{
      manifest_summary: %{"company_name" => "Imported Co"},
      artifacts_metadata: %{"workspace" => "tmp/import-run"},
      workspace_path: "/tmp/import-run",
      json_path: "/tmp/import-run/data.json",
      zip_path: "/tmp/import-run/files.zip",
      json_size_bytes: 2048,
      zip_size_bytes: 4096
    }

    assert {:ok, %ImportRun{} = run} = CompanyTransfers.create_import_run(ctx.account, attrs, dispatch: false)

    assert run.requested_by_id == ctx.account.id
    assert run.status == :pending
    assert run.manifest_summary == %{"company_name" => "Imported Co"}
    assert run.artifacts_metadata == %{"workspace" => "tmp/import-run"}
    assert run.workspace_path == "/tmp/import-run"
    assert run.json_path == "/tmp/import-run/data.json"
    assert run.zip_path == "/tmp/import-run/files.zip"
    assert run.json_size_bytes == 2048
    assert run.zip_size_bytes == 4096
    assert run.company_id == nil
  end

  test "export worker marks placeholder runs as failed until export logic exists", ctx do
    assert {:ok, run} = CompanyTransfers.create_export_run(ctx.company, ctx.account, %{}, dispatch: false)

    assert :ok = perform_job(ExportWorker, %{export_run_id: run.id})

    run = CompanyTransfers.get_export_run!(run.id)

    assert run.status == :failed
    assert run.started_at != nil
    assert run.completed_at != nil
    assert run.error_message == "Company export is not implemented yet"
  end

  test "import worker marks placeholder runs as failed until import logic exists", ctx do
    assert {:ok, run} = CompanyTransfers.create_import_run(ctx.account, %{}, dispatch: false)

    assert :ok = perform_job(ImportWorker, %{import_run_id: run.id})

    run = CompanyTransfers.get_import_run!(run.id)

    assert run.status == :failed
    assert run.started_at != nil
    assert run.completed_at != nil
    assert run.error_message == "Company import is not implemented yet"
  end
end

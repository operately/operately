defmodule Operately.CompanyTransfersTest do
  use Operately.DataCase
  use Oban.Testing, repo: Operately.Repo

  alias Operately.CompanyTransfers
  alias Operately.CompanyTransfers.Package.PackageJson
  alias Operately.CompanyTransfers.Package.Paths
  alias Operately.CompanyTransfers.{ExportRun, ExportWorker, ImportRun, ImportWorker}
  alias Operately.People.ApiToken
  alias Operately.Repo

  setup do
    on_exit(fn -> File.rm_rf!(Paths.root()) end)
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

  test "export worker creates a relational package and placeholder zip", ctx do
    ctx =
      ctx
      |> Factory.add_space(:space)
      |> Factory.add_project(:project, :space)
      |> Factory.add_api_token(:raw_token, :creator)

    other_ctx =
      %{}
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.add_project(:project, :space)

    api_token = Repo.get_by!(ApiToken, person_id: ctx.creator.id)

    assert {:ok, run} = CompanyTransfers.create_export_run(ctx.company, ctx.account, %{}, dispatch: false)

    assert :ok = perform_job(ExportWorker, %{export_run_id: run.id})

    run = CompanyTransfers.get_export_run!(run.id)
    package = PackageJson.read!(run.json_path)
    tables = Map.new(package["tables"], &{&1["name"], &1})
    exported_project_ids = Enum.map(tables["projects"]["rows"], & &1["id"])
    exported_company_ids = Enum.map(tables["companies"]["rows"], & &1["id"])
    exported_account_ids = Enum.map(tables["accounts"]["rows"], & &1["id"])
    exported_api_tokens = tables["api_tokens"]["rows"]
    serialized_hash = Enum.find(exported_api_tokens, &(&1["id"] == api_token.id))["token_hash"]

    assert run.status == :completed
    assert run.started_at != nil
    assert run.completed_at != nil
    assert run.error_message == nil
    assert run.json_path != nil
    assert run.zip_path != nil
    assert File.exists?(run.json_path)
    assert File.exists?(run.zip_path)
    assert package["files"] == []
    assert package["manifest"]["slice"] == "relational_minimal"
    assert package["manifest"]["source_company"]["id"] == ctx.company.id
    assert package["manifest"]["source_company"]["name"] == ctx.company.name
    assert run.manifest_summary["source_company"]["id"] == ctx.company.id
    assert ctx.project.id in exported_project_ids
    refute other_ctx.project.id in exported_project_ids
    assert ctx.company.id in exported_company_ids
    refute other_ctx.company.id in exported_company_ids
    assert ctx.account.id in exported_account_ids
    refute other_ctx.account.id in exported_account_ids
    assert serialized_hash == %{
             "__type__" => "bytea",
             "encoding" => "base64",
             "value" => Base.encode64(api_token.token_hash)
           }
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

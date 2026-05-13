defmodule Operately.CompanyTransfers do
  import Ecto.Query, warn: false

  alias Ecto.Multi
  alias Operately.CompanyTransfers.BlobIO
  alias Operately.CompanyTransfers.{ExportRun, ExportWorker, ImportRun, ImportWorker}
  alias Operately.CompanyTransfers.Package.Workspace
  alias Operately.People.Account
  alias Operately.Companies.Company
  alias Operately.Repo

  def list_export_runs do
    from(r in ExportRun, order_by: [desc: r.inserted_at]) |> Repo.all()
  end

  def list_company_export_runs(company_id) do
    from(r in ExportRun, where: r.company_id == ^company_id, order_by: [desc: r.inserted_at]) |> Repo.all()
  end

  def get_export_run(id), do: Repo.get(ExportRun, id)
  def get_export_run!(id), do: Repo.get!(ExportRun, id)

  def create_export_run(%Company{} = company, %Account{} = requested_by) do
    create_export_run(company, requested_by, %{}, [])
  end

  def create_export_run(%Company{} = company, %Account{} = requested_by, attrs) do
    create_export_run(company, requested_by, attrs, [])
  end

  def create_export_run(%Company{} = company, %Account{} = requested_by, attrs, opts) do
    attrs
    |> Map.put(:company_id, company.id)
    |> Map.put(:requested_by_id, requested_by.id)
    |> create_export_run_record(opts)
  end

  def create_export_run_record(attrs) do
    create_export_run_record(attrs, [])
  end

  def create_export_run_record(attrs, opts) do
    attrs = Map.new(attrs)
    dispatch? = Keyword.get(opts, :dispatch, true)

    Multi.new()
    |> Multi.insert(:export_run, ExportRun.changeset(attrs))
    |> maybe_enqueue_export_worker(dispatch?)
    |> Repo.transaction()
    |> Repo.extract_result(:export_run)
  end

  def update_export_run(%ExportRun{} = export_run, attrs) do
    export_run
    |> ExportRun.changeset(attrs)
    |> Repo.update()
  end

  def change_export_run(%ExportRun{} = export_run, attrs \\ %{}) do
    ExportRun.changeset(export_run, attrs)
  end

  def mark_export_run_running(%ExportRun{} = export_run, attrs \\ %{}) do
    attrs =
      attrs
      |> Map.new()
      |> Map.put(:status, :running)
      |> Map.put_new(:started_at, DateTime.utc_now())
      |> Map.delete(:completed_at)
      |> Map.delete(:cancelled_at)

    update_export_run(export_run, attrs)
  end

  def mark_export_run_completed(%ExportRun{} = export_run, attrs \\ %{}) do
    attrs =
      attrs
      |> Map.new()
      |> Map.put(:status, :completed)
      |> Map.put(:completed_at, DateTime.utc_now())
      |> Map.put(:error_message, nil)

    update_export_run(export_run, attrs)
  end

  def mark_export_run_failed(%ExportRun{} = export_run, message, attrs \\ %{}) do
    attrs =
      attrs
      |> Map.new()
      |> Map.put(:status, :failed)
      |> Map.put(:completed_at, DateTime.utc_now())
      |> Map.put(:error_message, message)

    update_export_run(export_run, attrs)
  end

  def mark_export_run_cancelled(%ExportRun{} = export_run, %Account{} = cancelled_by, attrs \\ %{}) do
    attrs =
      attrs
      |> Map.new()
      |> Map.put(:status, :cancelled)
      |> Map.put(:cancelled_by_id, cancelled_by.id)
      |> Map.put(:cancelled_at, DateTime.utc_now())

    update_export_run(export_run, attrs)
  end

  def prepare_export_workspace(%ExportRun{} = export_run) do
    workspace = Workspace.prepare!(:export, export_run.id)

    attrs = %{
      workspace_path: workspace.root_path,
      json_path: workspace.json_path,
      zip_path: workspace.zip_path,
      artifacts_metadata: Map.put(export_run.artifacts_metadata || %{}, "workspace", Workspace.metadata(workspace))
    }

    case update_export_run(export_run, attrs) do
      {:ok, export_run} -> {:ok, export_run, workspace}
      error -> error
    end
  end

  def publish_export_artifacts(%ExportRun{} = export_run, artifact_paths) when is_map(artifact_paths) do
    export_run = Repo.preload(export_run, [:company, :requested_by])
    person = Operately.People.get_person!(export_run.requested_by, export_run.company)

    {:ok, package_blob} = BlobIO.create_and_upload_company_file(
      export_run.company,
      person,
      artifact_paths.zip_path,
      "application/zip"
    )

    package_size = File.stat!(artifact_paths.zip_path).size

    attrs = %{
      package_blob_id: package_blob.id,
      package_size_bytes: package_size
    }

    update_export_run(export_run, attrs)
  end

  def list_import_runs do
    from(r in ImportRun, order_by: [desc: r.inserted_at]) |> Repo.all()
  end

  def list_account_import_runs(requested_by_id) do
    from(r in ImportRun, where: r.requested_by_id == ^requested_by_id, order_by: [desc: r.inserted_at]) |> Repo.all()
  end

  def get_import_run(id), do: Repo.get(ImportRun, id)
  def get_import_run!(id), do: Repo.get!(ImportRun, id)

  def create_import_run(%Account{} = requested_by) do
    create_import_run(requested_by, %{}, [])
  end

  def create_import_run(%Account{} = requested_by, attrs) do
    create_import_run(requested_by, attrs, [])
  end

  def create_import_run(%Account{} = requested_by, attrs, opts) do
    attrs
    |> Map.put(:requested_by_id, requested_by.id)
    |> create_import_run_record(opts)
  end

  def create_import_run_record(attrs) do
    create_import_run_record(attrs, [])
  end

  def create_import_run_record(attrs, opts) do
    attrs = Map.new(attrs)
    dispatch? = Keyword.get(opts, :dispatch, true)

    Multi.new()
    |> Multi.insert(:import_run, ImportRun.changeset(attrs))
    |> maybe_enqueue_import_worker(dispatch?)
    |> Repo.transaction()
    |> Repo.extract_result(:import_run)
  end

  def update_import_run(%ImportRun{} = import_run, attrs) do
    import_run
    |> ImportRun.changeset(attrs)
    |> Repo.update()
  end

  def change_import_run(%ImportRun{} = import_run, attrs \\ %{}) do
    ImportRun.changeset(import_run, attrs)
  end

  def mark_import_run_running(%ImportRun{} = import_run, attrs \\ %{}) do
    attrs =
      attrs
      |> Map.new()
      |> Map.put(:status, :running)
      |> Map.put_new(:started_at, DateTime.utc_now())
      |> Map.delete(:completed_at)
      |> Map.delete(:cancelled_at)

    update_import_run(import_run, attrs)
  end

  def mark_import_run_completed(%ImportRun{} = import_run, attrs \\ %{}) do
    attrs =
      attrs
      |> Map.new()
      |> Map.put(:status, :completed)
      |> Map.put(:completed_at, DateTime.utc_now())
      |> Map.put(:error_message, nil)

    update_import_run(import_run, attrs)
  end

  def mark_import_run_failed(%ImportRun{} = import_run, message, attrs \\ %{}) do
    attrs =
      attrs
      |> Map.new()
      |> Map.put(:status, :failed)
      |> Map.put(:completed_at, DateTime.utc_now())
      |> Map.put(:error_message, message)

    update_import_run(import_run, attrs)
  end

  def mark_import_run_cancelled(%ImportRun{} = import_run, %Account{} = cancelled_by, attrs \\ %{}) do
    attrs =
      attrs
      |> Map.new()
      |> Map.put(:status, :cancelled)
      |> Map.put(:cancelled_by_id, cancelled_by.id)
      |> Map.put(:cancelled_at, DateTime.utc_now())

    update_import_run(import_run, attrs)
  end

  def prepare_import_workspace(%ImportRun{} = import_run) do
    workspace = Workspace.prepare!(:import, import_run.id)

    attrs = %{
      workspace_path: workspace.root_path,
      json_path: workspace.json_path,
      zip_path: workspace.zip_path,
      artifacts_metadata: Map.put(import_run.artifacts_metadata || %{}, "workspace", Workspace.metadata(workspace))
    }

    case update_import_run(import_run, attrs) do
      {:ok, import_run} -> {:ok, import_run, workspace}
      error -> error
    end
  end

  defp maybe_enqueue_export_worker(multi, false), do: Multi.put(multi, :worker, nil)

  defp maybe_enqueue_export_worker(multi, true) do
    Multi.run(multi, :worker, fn _repo, %{export_run: export_run} ->
      ExportWorker.new(%{export_run_id: export_run.id}) |> Oban.insert()
    end)
  end

  defp maybe_enqueue_import_worker(multi, false), do: Multi.put(multi, :worker, nil)

  defp maybe_enqueue_import_worker(multi, true) do
    Multi.run(multi, :worker, fn _repo, %{import_run: import_run} ->
      ImportWorker.new(%{import_run_id: import_run.id}) |> Oban.insert()
    end)
  end
end

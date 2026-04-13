defmodule Operately.Repo.Migrations.AddBlobReferencesToExportImportRuns do
  use Ecto.Migration

  def change do
    alter table(:company_export_runs) do
      add :json_blob_id, references(:blobs, type: :binary_id, on_delete: :nilify_all)
      add :zip_blob_id, references(:blobs, type: :binary_id, on_delete: :nilify_all)
      remove :json_path
      remove :zip_path
    end

    alter table(:company_import_runs) do
      add :json_blob_id, references(:blobs, type: :binary_id, on_delete: :nilify_all)
      add :zip_blob_id, references(:blobs, type: :binary_id, on_delete: :nilify_all)
      remove :json_path
      remove :zip_path
    end

    create index(:company_export_runs, [:json_blob_id])
    create index(:company_export_runs, [:zip_blob_id])
    create index(:company_import_runs, [:json_blob_id])
    create index(:company_import_runs, [:zip_blob_id])
  end
end

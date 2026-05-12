defmodule Operately.Repo.Migrations.AddPackageBlobReferencesToCompanyTransferRuns do
  use Ecto.Migration

  def change do
    drop index(:company_export_runs, [:json_blob_id])
    drop index(:company_export_runs, [:zip_blob_id])
    drop index(:company_import_runs, [:json_blob_id])
    drop index(:company_import_runs, [:zip_blob_id])

    alter table(:company_export_runs) do
      add :package_blob_id, references(:blobs, type: :binary_id, on_delete: :nilify_all)
      add :package_size_bytes, :bigint
      remove :json_blob_id
      remove :zip_blob_id
      remove :json_size_bytes
      remove :zip_size_bytes
    end

    alter table(:company_import_runs) do
      add :package_blob_id, references(:blobs, type: :binary_id, on_delete: :nilify_all)
      remove :json_blob_id
      remove :zip_blob_id
      remove :json_size_bytes
      remove :zip_size_bytes
    end

    create index(:company_export_runs, [:package_blob_id])
    create index(:company_import_runs, [:package_blob_id])
  end
end

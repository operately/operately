defmodule Operately.Repo.Migrations.AddCompanyTransferRuns do
  use Ecto.Migration

  def change do
    create table(:company_export_runs, primary_key: false) do
      add :id, :binary_id, primary_key: true

      add :company_id, references(:companies, type: :binary_id, on_delete: :delete_all),
        null: false

      add :requested_by_id, references(:accounts, type: :binary_id, on_delete: :nilify_all),
        null: false

      add :cancelled_by_id, references(:accounts, type: :binary_id, on_delete: :nilify_all)

      add :status, :string, null: false, default: "pending"
      add :current_step, :string
      add :total_steps, :integer, null: false, default: 0
      add :percentage, :float, null: false, default: 0.0
      add :current_table, :string

      add :tables_count, :integer, null: false, default: 0
      add :rows_count, :integer, null: false, default: 0
      add :files_count, :integer, null: false, default: 0

      add :validation_errors, {:array, :map}, null: false, default: []
      add :manifest_summary, :map, null: false, default: %{}
      add :artifacts_metadata, :map, null: false, default: %{}
      add :workspace_path, :text
      add :json_path, :text
      add :zip_path, :text
      add :json_size_bytes, :bigint
      add :zip_size_bytes, :bigint
      add :error_message, :text

      add :started_at, :utc_datetime_usec
      add :completed_at, :utc_datetime_usec
      add :cancelled_at, :utc_datetime_usec

      timestamps()
    end

    create index(:company_export_runs, [:company_id, :inserted_at])
    create index(:company_export_runs, [:requested_by_id, :inserted_at])
    create index(:company_export_runs, [:status])

    create table(:company_import_runs, primary_key: false) do
      add :id, :binary_id, primary_key: true

      add :company_id, references(:companies, type: :binary_id, on_delete: :nilify_all)

      add :requested_by_id, references(:accounts, type: :binary_id, on_delete: :nilify_all),
        null: false

      add :cancelled_by_id, references(:accounts, type: :binary_id, on_delete: :nilify_all)

      add :status, :string, null: false, default: "pending"
      add :current_step, :string
      add :total_steps, :integer, null: false, default: 0
      add :percentage, :float, null: false, default: 0.0
      add :current_table, :string

      add :tables_count, :integer, null: false, default: 0
      add :rows_count, :integer, null: false, default: 0
      add :files_count, :integer, null: false, default: 0

      add :validation_errors, {:array, :map}, null: false, default: []
      add :manifest_summary, :map, null: false, default: %{}
      add :artifacts_metadata, :map, null: false, default: %{}
      add :workspace_path, :text
      add :json_path, :text
      add :zip_path, :text
      add :json_size_bytes, :bigint
      add :zip_size_bytes, :bigint
      add :error_message, :text

      add :started_at, :utc_datetime_usec
      add :completed_at, :utc_datetime_usec
      add :cancelled_at, :utc_datetime_usec

      timestamps()
    end

    create index(:company_import_runs, [:company_id, :inserted_at])
    create index(:company_import_runs, [:requested_by_id, :inserted_at])
    create index(:company_import_runs, [:status])
  end
end

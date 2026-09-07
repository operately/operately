defmodule Operately.Repo.Migrations.CreateKpiEntryEdits do
  use Ecto.Migration

  def change do
    create table(:kpi_entry_edits, primary_key: false) do
      add :id, :binary_id, primary_key: true

      add :kpi_entry_id, references(:kpi_entries, on_delete: :delete_all, type: :binary_id),
        null: false

      add :edited_by_id, references(:people, on_delete: :nilify_all, type: :binary_id)
      add :previous_value, :float, null: false
      add :previous_period, :date, null: false

      timestamps()
    end

    create index(:kpi_entry_edits, [:kpi_entry_id])
    create index(:kpi_entry_edits, [:edited_by_id])
  end
end

defmodule Operately.Repo.Migrations.CreateKpiEntries do
  use Ecto.Migration

  def change do
    create table(:kpi_entries, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :kpi_id, references(:kpis, on_delete: :delete_all, type: :binary_id), null: false
      add :value, :float, null: false
      add :period, :date, null: false
      add :recorded_by_id, references(:people, on_delete: :nilify_all, type: :binary_id)

      timestamps()
    end

    create index(:kpi_entries, [:kpi_id])
    create index(:kpi_entries, [:kpi_id, :period])
  end
end

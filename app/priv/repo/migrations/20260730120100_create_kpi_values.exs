defmodule Operately.Repo.Migrations.CreateKpiValues do
  use Ecto.Migration

  def change do
    create table(:kpi_values, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :value, :float, null: false
      add :recorded_at, :naive_datetime, null: false
      add :kpi_id, references(:kpis, on_delete: :delete_all, type: :binary_id), null: false
      add :person_id, references(:people, on_delete: :nothing, type: :binary_id), null: false

      timestamps()
    end

    create index(:kpi_values, [:kpi_id])
    create index(:kpi_values, [:person_id])
  end
end

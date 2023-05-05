defmodule Operately.Repo.Migrations.CreateKpiMetrics do
  use Ecto.Migration

  def change do
    create table(:kpi_metrics, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :date, :naive_datetime
      add :value, :integer
      add :kpi_id, references(:kpis, on_delete: :nothing, type: :binary_id)

      timestamps()
    end

    create index(:kpi_metrics, [:kpi_id])
  end
end

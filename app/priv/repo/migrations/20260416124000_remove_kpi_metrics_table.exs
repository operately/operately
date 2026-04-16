defmodule Operately.Repo.Migrations.RemoveKpiMetricsAndKpisTables do
  use Ecto.Migration

  def change do
    drop table(:kpi_metrics)
    drop table(:kpis)
  end
end

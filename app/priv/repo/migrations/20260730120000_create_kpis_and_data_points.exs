defmodule Operately.Repo.Migrations.CreateKpisAndDataPoints do
  use Ecto.Migration

  def change do
    create table(:kpis, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :company_id, references(:companies, type: :binary_id, on_delete: :delete_all), null: false
      add :space_id, references(:groups, type: :binary_id, on_delete: :delete_all), null: false
      add :creator_id, references(:people, type: :binary_id, on_delete: :nilify_all)

      add :name, :string, null: false
      add :unit, :string
      add :target, :float

      timestamps()
    end

    create index(:kpis, [:company_id])
    create index(:kpis, [:space_id])

    create table(:kpi_data_points, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :kpi_id, references(:kpis, type: :binary_id, on_delete: :delete_all), null: false

      add :value, :float, null: false
      add :recorded_for, :date, null: false

      timestamps()
    end

    create index(:kpi_data_points, [:kpi_id])
    create unique_index(:kpi_data_points, [:kpi_id, :recorded_for])
  end
end

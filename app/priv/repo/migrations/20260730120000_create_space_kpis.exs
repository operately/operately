defmodule Operately.Repo.Migrations.CreateSpaceKpis do
  use Ecto.Migration

  def change do
    create table(:kpis, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :space_id, references(:groups, on_delete: :delete_all, type: :binary_id), null: false
      add :name, :string, null: false
      add :description, :text
      add :unit, :string
      add :target, :float
      add :target_direction, :string
      add :warning_threshold, :float
      add :warning_direction, :string
      add :danger_threshold, :float
      add :danger_direction, :string

      timestamps()
    end

    create index(:kpis, [:space_id])

    create table(:kpi_data_points, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :kpi_id, references(:kpis, on_delete: :delete_all, type: :binary_id), null: false
      add :value, :float, null: false
      add :recorded_for, :date, null: false

      timestamps()
    end

    create index(:kpi_data_points, [:kpi_id])
  end
end

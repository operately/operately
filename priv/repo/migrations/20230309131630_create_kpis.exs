defmodule Operately.Repo.Migrations.CreateKpis do
  use Ecto.Migration

  def change do
    create table(:kpis, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :name, :string
      add :unit, :string
      add :target, :integer
      add :target_direction, :string
      add :warning_threshold, :integer
      add :warning_direction, :string
      add :danger_threshold, :integer
      add :danger_direction, :string

      timestamps()
    end
  end
end

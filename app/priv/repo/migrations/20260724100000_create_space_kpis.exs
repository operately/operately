defmodule Operately.Repo.Migrations.CreateSpaceKpis do
  use Ecto.Migration

  def change do
    create table(:kpis, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :space_id, references(:groups, on_delete: :delete_all, type: :binary_id), null: false
      add :champion_id, references(:people, on_delete: :nilify_all, type: :binary_id)
      add :name, :string, null: false
      add :unit, :string, null: false
      add :cadence, :string, null: false

      timestamps()
    end

    create index(:kpis, [:space_id])
    create index(:kpis, [:champion_id])
  end
end

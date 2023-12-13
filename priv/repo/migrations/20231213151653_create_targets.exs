defmodule Operately.Repo.Migrations.CreateTargets do
  use Ecto.Migration

  def change do
    create table(:targets, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :name, :string
      add :from, :float
      add :to, :float
      add :unit, :string
      add :goal_id, references(:goals, on_delete: :nothing, type: :binary_id)

      timestamps()
    end

    create index(:targets, [:goal_id])
  end
end

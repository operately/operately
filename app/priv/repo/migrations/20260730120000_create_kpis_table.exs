defmodule Operately.Repo.Migrations.CreateKpisTable do
  use Ecto.Migration

  def change do
    create table(:kpis, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :name, :string, null: false
      add :unit, :string, null: false
      add :archived_at, :naive_datetime, null: true
      add :space_id, references(:groups, on_delete: :nothing, type: :binary_id), null: false
      add :creator_id, references(:people, on_delete: :nothing, type: :binary_id), null: false

      timestamps()
    end

    create index(:kpis, [:space_id])
    create index(:kpis, [:creator_id])
  end
end

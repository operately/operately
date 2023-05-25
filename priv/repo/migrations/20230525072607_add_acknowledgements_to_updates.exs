defmodule Operately.Repo.Migrations.AddAcknowledgementsToUpdates do
  use Ecto.Migration

  def change do
    alter table(:updates) do
      add :acknowledged, :boolean, default: false
      add :acknowledged_at, :utc_datetime
      add :acknowledging_person_id, references(:people, type: :binary_id)
    end

    create index(:updates, [:acknowledging_person_id])
  end
end

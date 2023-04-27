defmodule Operately.Repo.Migrations.AddOwnerToObjectives do
  use Ecto.Migration

  def change do
    alter table(:objectives) do
      add :owner_id, references(:people, type: :binary_id)
    end

    create index(:objectives, [:owner_id])
  end
end

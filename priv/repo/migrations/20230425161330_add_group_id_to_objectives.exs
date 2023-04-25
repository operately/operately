defmodule Operately.Repo.Migrations.AddGroupIdToObjectives do
  use Ecto.Migration

  def change do
    alter table(:objectives) do
      add :group_id, references(:groups, on_delete: :nothing, type: :binary_id)
    end

    create index(:objectives, [:group_id])
  end
end

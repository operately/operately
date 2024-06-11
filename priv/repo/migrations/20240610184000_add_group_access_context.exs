defmodule Operately.Repo.Migrations.AddGroupAccessContext do
  use Ecto.Migration

  def change do
    alter table(:access_contexts) do
      add :group_id, references(:groups, on_delete: :nothing, type: :binary_id), null: true
    end

    create unique_index(:access_contexts, [:group_id])
  end
end

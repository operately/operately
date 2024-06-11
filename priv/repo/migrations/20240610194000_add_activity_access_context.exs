defmodule Operately.Repo.Migrations.AddActivityAccessContext do
  use Ecto.Migration

  def change do
    alter table(:activities) do
      add :context_id, references(:access_contexts, on_delete: :nothing, type: :binary_id), null: true
    end

    create index(:activities, [:context_id])
  end
end

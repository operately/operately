defmodule Operately.Repo.Migrations.AddActivityAccessContext do
  use Ecto.Migration

  def change do
    alter table(:access_contexts) do
      add :activity_id, references(:activities, on_delete: :nothing, type: :binary_id), null: true
    end

    create unique_index(:access_contexts, [:activity_id])
  end
end

defmodule Operately.Repo.Migrations.AddProjectAccessContext do
  use Ecto.Migration

  def change do
    alter table(:access_contexts) do
      add :project_id, references(:projects, on_delete: :nothing, type: :binary_id), null: true
    end

    create unique_index(:access_contexts, [:project_id])
  end
end

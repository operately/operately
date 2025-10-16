defmodule Operately.Repo.Migrations.AddCascadeDeleteToProjectAccessContexts do
  use Ecto.Migration

  def up do
    drop constraint(:access_contexts, "access_contexts_project_id_fkey")

    alter table(:access_contexts) do
      modify :project_id, references(:projects, on_delete: :delete_all, type: :binary_id),
        null: true
    end
  end

  def down do
    drop constraint(:access_contexts, "access_contexts_project_id_fkey")

    alter table(:access_contexts) do
      modify :project_id, references(:projects, on_delete: :nothing, type: :binary_id), null: true
    end
  end
end

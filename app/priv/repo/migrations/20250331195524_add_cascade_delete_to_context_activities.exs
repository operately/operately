defmodule Operately.Repo.Migrations.AddCascadeDeleteToContextActivities do
  use Ecto.Migration

  def up do
    drop constraint(:activities, "activities_context_id_fkey")

    alter table(:activities) do
      modify :access_context_id,
             references(:access_contexts, on_delete: :delete_all, type: :binary_id),
             null: true
    end
  end

  def down do
    drop constraint(:activities, "activities_context_id_fkey")

    alter table(:activities) do
      modify :access_context_id,
             references(:access_contexts, on_delete: :nothing, type: :binary_id),
             null: true
    end
  end
end

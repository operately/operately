defmodule Operately.Repo.Migrations.CascadeDeleteFromSpacesToAccessContexts do
  use Ecto.Migration

  def up do
    drop constraint(:access_contexts, :access_contexts_group_id_fkey)

    alter table(:access_contexts) do
      modify :group_id, references(:groups, on_delete: :delete_all, type: :binary_id)
    end
  end

  def down do
    drop constraint(:access_contexts, :access_contexts_group_id_fkey)

    alter table(:access_contexts) do
      modify :group_id, references(:groups, on_delete: :nothing, type: :binary_id)
    end
  end
end

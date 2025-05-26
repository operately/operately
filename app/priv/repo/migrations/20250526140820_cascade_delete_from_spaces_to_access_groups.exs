defmodule Operately.Repo.Migrations.CascadeDeleteFromSpacesToAccessGroups do
  use Ecto.Migration

  def up do
    drop constraint(:access_groups, :access_groups_group_id_fkey)

    alter table(:access_groups) do
      modify :group_id, references(:groups, on_delete: :delete_all, type: :binary_id)
    end
  end

  def down do
    drop constraint(:access_groups, :access_groups_group_id_fkey)

    alter table(:access_groups) do
      modify :group_id, references(:groups, on_delete: :nothing, type: :binary_id)
    end
  end
end

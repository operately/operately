defmodule Operately.Repo.Migrations.AddGroupIdFieldToAccessGroupsTable do
  use Ecto.Migration

  def change do
    alter table(:access_groups) do
      add :group_id, references(:groups, type: :binary_id, on_delete: :nothing)
    end

    create index(:access_groups, [:group_id])
  end
end

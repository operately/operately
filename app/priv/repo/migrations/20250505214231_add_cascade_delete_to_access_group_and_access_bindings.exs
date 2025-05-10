defmodule Operately.Repo.Migrations.AddCascadeDeleteToAccessGroupAndAccessBindings do
  use Ecto.Migration

  def up do
    drop constraint(:access_bindings, "access_bindings_group_id_fkey")

    alter table(:access_bindings) do
      modify :group_id, references(:access_groups, on_delete: :delete_all, type: :binary_id)
    end
  end

  def down do
    drop constraint(:access_bindings, "access_bindings_group_id_fkey")

    alter table(:access_bindings) do
      modify :group_id, references(:access_groups, on_delete: :nothing, type: :binary_id)
    end
  end
end

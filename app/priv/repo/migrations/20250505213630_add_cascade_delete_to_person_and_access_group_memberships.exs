defmodule Operately.Repo.Migrations.AddCascadeDeleteToPersonAndAccessGroupMemberships do
  use Ecto.Migration

  def up do
    drop constraint(:access_group_memberships, "access_group_memberships_person_id_fkey")

    alter table(:access_group_memberships) do
      modify :person_id, references(:people, on_delete: :delete_all, type: :binary_id)
    end
  end

  def down do
    drop constraint(:access_group_memberships, "access_group_memberships_person_id_fkey")

    alter table(:access_group_memberships) do
      modify :person_id, references(:people, on_delete: :nothing, type: :binary_id)
    end
  end
end

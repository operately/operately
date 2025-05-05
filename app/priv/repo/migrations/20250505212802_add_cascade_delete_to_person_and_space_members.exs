defmodule Operately.Repo.Migrations.AddCascadeDeleteToPersonAndSpaceMembers do
  use Ecto.Migration

  def up do
    drop constraint(:members, "members_person_id_fkey")

    alter table(:members) do
      modify :person_id, references(:people, on_delete: :delete_all, type: :binary_id)
    end
  end

  def down do
    drop constraint(:members, "members_person_id_fkey")

    alter table(:members) do
      modify :person_id, references(:people, on_delete: :nothing, type: :binary_id)
    end
  end
end

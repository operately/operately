defmodule Operately.Repo.Migrations.CascadeDeleteFromPeopleToInvitations do
  use Ecto.Migration

  def up do
    drop constraint(:invitations, :invitations_admin_id_fkey)

    alter table(:invitations) do
      modify :admin_id, references(:people, on_delete: :delete_all, type: :binary_id)
    end
  end

  def down do
    drop constraint(:invitations, :invitations_admin_id_fkey)

    alter table(:invitations) do
      modify :admin_id, references(:people, on_delete: :nothing, type: :binary_id)
    end
  end
end

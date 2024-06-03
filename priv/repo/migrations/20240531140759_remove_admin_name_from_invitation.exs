defmodule Operately.Repo.Migrations.RemoveAdminNameFromInvitation do
  use Ecto.Migration

  def change do
    alter table(:invitations) do
      remove :admin_name, :string
    end
  end
end

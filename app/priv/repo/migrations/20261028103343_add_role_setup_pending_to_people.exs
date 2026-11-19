defmodule Operately.Repo.Migrations.AddRoleSetupPendingToPeople do
  use Ecto.Migration

  def change do
    alter table(:people) do
      add :title_setup_pending, :boolean, default: false, null: false
    end
  end
end

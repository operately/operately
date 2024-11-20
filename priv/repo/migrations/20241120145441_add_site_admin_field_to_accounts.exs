defmodule Operately.Repo.Migrations.AddSiteAdminFieldToAccounts do
  use Ecto.Migration

  def change do
    alter table(:accounts) do
      add :site_admin, :boolean, default: false
    end
  end
end

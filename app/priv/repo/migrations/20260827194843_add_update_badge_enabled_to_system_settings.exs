defmodule Operately.Repo.Migrations.AddUpdateBadgeEnabledToSystemSettings do
  use Ecto.Migration

  def change do
    alter table(:system_settings) do
      add :update_badge_enabled, :boolean, null: false, default: true
    end
  end
end

defmodule Operately.Repo.Migrations.AddNotificationFieldsToPeople do
  use Ecto.Migration

  def change do
    alter table(:people) do
      add :send_daily_summary, :boolean, default: true
      add :notify_on_mention, :boolean, default: true
      add :notify_about_assignments, :boolean, default: true
    end
  end
end

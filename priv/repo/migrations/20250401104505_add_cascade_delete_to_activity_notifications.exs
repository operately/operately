defmodule Operately.Repo.Migrations.AddCascadeDeleteToActivityNotifications do
  use Ecto.Migration

  def up do
    drop constraint(:notifications, "notifications_activity_id_fkey")

    alter table(:notifications) do
      modify :activity_id, references(:activities, on_delete: :delete_all, type: :binary_id)
    end
  end

  def down do
    drop constraint(:notifications, "notifications_activity_id_fkey")

    alter table(:notifications) do
      modify :activity_id, references(:activities, on_delete: :nothing, type: :binary_id)
    end
  end
end

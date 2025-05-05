defmodule Operately.Repo.Migrations.AddCascadeDeleteToPersonAndNotifications do
  use Ecto.Migration

  def up do
    drop constraint(:notifications, "notifications_person_id_fkey")

    alter table(:notifications) do
      modify :person_id, references(:people, on_delete: :delete_all, type: :binary_id)
    end
  end

  def down do
    drop constraint(:notifications, "notifications_person_id_fkey")

    alter table(:notifications) do
      modify :person_id, references(:people, on_delete: :nothing, type: :binary_id)
    end
  end
end

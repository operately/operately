defmodule Operately.Repo.Migrations.CreateNotifications do
  use Ecto.Migration

  def change do
    create table(:notifications, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :read, :boolean, default: false, null: false
      add :read_at, :naive_datetime
      add :email_sent, :boolean, default: false, null: false
      add :email_sent_at, :naive_datetime
      add :should_send_email, :boolean, default: false, null: false
      add :activity_id, references(:activities, on_delete: :nothing, type: :binary_id)
      add :person_id, references(:people, on_delete: :nothing, type: :binary_id)

      timestamps()
    end

    create index(:notifications, [:activity_id])
    create index(:notifications, [:person_id])
  end
end

defmodule Operately.Repo.Migrations.CreateNotificationEmailBatches do
  use Ecto.Migration

  def change do
    create table(:notification_email_batches, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :status, :string, null: false, default: "scheduled"
      add :window_started_at, :naive_datetime, null: false
      add :send_at, :naive_datetime, null: false
      add :sent_at, :naive_datetime
      add :error, :text
      add :person_id, references(:people, on_delete: :delete_all, type: :binary_id), null: false
      add :access_context_id, references(:access_contexts, on_delete: :delete_all, type: :binary_id), null: false

      timestamps()
    end

    alter table(:notifications) do
      add :email_batch_id, references(:notification_email_batches, on_delete: :nilify_all, type: :binary_id)
    end

    create index(:notification_email_batches, [:person_id, :access_context_id, :status, :send_at])
    create index(:notification_email_batches, [:status, :send_at])
    create index(:notifications, [:email_batch_id])
  end
end

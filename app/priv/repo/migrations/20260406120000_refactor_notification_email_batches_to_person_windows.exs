defmodule Operately.Repo.Migrations.RefactorNotificationEmailBatchesToPersonWindows do
  use Ecto.Migration

  def change do
    drop_if_exists index(:notification_email_batches, [:person_id, :access_context_id, :status, :send_at])

    alter table(:notification_email_batches) do
      add :window_minutes, :integer, null: false, default: 5
      remove :access_context_id
    end

    create index(:notification_email_batches, [:person_id, :status, :send_at])
  end
end

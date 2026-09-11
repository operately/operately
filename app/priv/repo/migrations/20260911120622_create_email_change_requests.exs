defmodule Operately.Repo.Migrations.CreateEmailChangeRequests do
  use Ecto.Migration

  def change do
    create table(:email_change_requests, primary_key: false) do
      add :id, :binary_id, primary_key: true

      add :account_id, references(:accounts, type: :binary_id, on_delete: :delete_all),
        null: false

      add :original_email, :citext, null: false
      add :email, :citext, null: false
      add :code_hash, :binary, null: false
      add :expires_at, :utc_datetime, null: false
      add :sent_at, :utc_datetime, null: false
      add :attempts, :integer, null: false, default: 0
      add :invalidated_at, :utc_datetime
      timestamps()
    end

    create index(:email_change_requests, [:account_id, :sent_at])

    create unique_index(:email_change_requests, [:account_id],
             where: "invalidated_at IS NULL",
             name: :one_pending_email_change_per_account
           )
  end
end

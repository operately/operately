defmodule Operately.Repo.Migrations.AddCurrentInboxVerificationToEmailChanges do
  use Ecto.Migration

  def change do
    alter table(:email_change_requests) do
      add :stage, :string
      add :current_email_verified_at, :utc_datetime
    end

    create constraint(:email_change_requests, :valid_email_change_stage,
             check: "stage IS NULL OR stage IN ('current_email', 'new_email')"
           )
  end
end

defmodule Operately.Repo.Migrations.CreateInvitationTokens do
  use Ecto.Migration

  def change do
    create table(:invitation_tokens, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :hashed_token, :string
      add :invitation_id, references(:invitations, on_delete: :nothing, type: :binary_id)
      add :valid_until, :utc_datetime

      timestamps()
    end

    create index(:invitation_tokens, [:invitation_id])
  end
end

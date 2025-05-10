defmodule Operately.Repo.Migrations.AddCascadeDeleteToInvitationAndInvitationTokens do
  use Ecto.Migration

  def up do
    drop constraint(:invitation_tokens, "invitation_tokens_invitation_id_fkey")

    alter table(:invitation_tokens) do
      modify :invitation_id, references(:invitations, on_delete: :delete_all, type: :binary_id)
    end
  end

  def down do
    drop constraint(:invitation_tokens, "invitation_tokens_invitation_id_fkey")

    alter table(:invitation_tokens) do
      modify :invitation_id, references(:invitations, on_delete: :nothing, type: :binary_id)
    end
  end
end

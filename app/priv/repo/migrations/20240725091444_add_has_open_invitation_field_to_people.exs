defmodule Operately.Repo.Migrations.AddHasOpenInvitationFieldToPeople do
  use Ecto.Migration

  def change do
    alter table(:people) do
      add :has_open_invitation, :boolean, default: false, null: false
    end
  end
end

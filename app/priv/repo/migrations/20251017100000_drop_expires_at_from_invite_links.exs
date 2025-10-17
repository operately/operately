defmodule Operately.Repo.Migrations.DropExpiresAtFromInviteLinks do
  use Ecto.Migration

  def change do
    alter table(:invite_links) do
      remove :expires_at, :utc_datetime
    end
  end
end


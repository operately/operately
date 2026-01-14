defmodule Operately.Repo.Migrations.BackfillInviteLinkTypesAndPersonalInviteLinks do
  use Ecto.Migration

  def up do
    Operately.Data.Change092PopulateInviteLinkTypes.run()
    Operately.Data.Change092BackfillPersonalInviteLinksForOpenInvitations.run()
  end

  def down do
  end
end

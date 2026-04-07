defmodule Operately.Repo.Migrations.BackfillNotifyOnMentionFromEmailPreference do
  use Ecto.Migration

  def up do
    Operately.Data.Change097BackfillNotifyOnMentionFromEmailPreference.run()
  end

  def down do
  end
end

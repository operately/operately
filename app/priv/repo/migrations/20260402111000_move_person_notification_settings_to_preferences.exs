defmodule Operately.Repo.Migrations.MovePersonNotificationSettingsToPreferences do
  use Ecto.Migration

  def up do
    Operately.Data.Change096MovePersonNotificationSettingsToPreferences.run()
  end

  def down do
  end
end

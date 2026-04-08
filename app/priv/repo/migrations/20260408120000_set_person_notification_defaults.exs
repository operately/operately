defmodule Operately.Repo.Migrations.SetPersonNotificationDefaults do
  use Ecto.Migration

  def up do
    Operately.Data.Change098SetPersonNotificationDefaults.run()
  end

  def down do
  end
end

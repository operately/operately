defmodule Operately.Repo.Migrations.PopulateTaskStatusFromDeprecatedStatusField do
  use Ecto.Migration

  def up do
    Operately.Data.Change088PopulateTaskStatusFromDeprecatedStatus.run()
  end

  def down do
    :ok
  end
end

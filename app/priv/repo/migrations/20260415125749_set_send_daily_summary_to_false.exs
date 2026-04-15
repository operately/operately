defmodule Operately.Repo.Migrations.SetSendDailySummaryToFalse do
  use Ecto.Migration

  def up do
    Operately.Data.Change099SetSendDailySummaryToFalse.run()
  end

  def down do
  end
end

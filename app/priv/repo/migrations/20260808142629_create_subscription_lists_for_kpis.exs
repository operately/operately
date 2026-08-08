defmodule Operately.Repo.Migrations.CreateSubscriptionListsForKpis do
  use Ecto.Migration

  def up do
    Operately.Data.Change112CreateSubscriptionListsForKpis.run()
  end

  def down do
    :ok
  end
end

defmodule Operately.Repo.Migrations.CreateSubscriptionsListForExistingGoalUpdates do
  use Ecto.Migration

  def up do
    Operately.Data.Change028CreateSubscriptionsListForGoalUpdates.run()
  end

  def down do

  end
end

defmodule Operately.Repo.Migrations.CreateSubscriptionsForExistingGoalDiscussions do
  use Ecto.Migration

  def up do
    Operately.Data.Change054CreateSubscriptionsForExistingGoalDiscussions.run()
  end

  def down do
  end
end

defmodule Operately.Repo.Migrations.CreateSubscriptionsForExistingProjectContributors do
  use Ecto.Migration

  def up do
    Operately.Data.Change085CreateSubscriptionsForProjectContributors.run()
  end

  def down do

  end
end

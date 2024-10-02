defmodule Operately.Repo.Migrations.CreateSubscriptionsListForExistingProjectRetrospective do
  use Ecto.Migration

  def up do
    Operately.Data.Change030CreateSubscriptionsListForProjectRetrospectives.run()
  end

  def down do

  end
end

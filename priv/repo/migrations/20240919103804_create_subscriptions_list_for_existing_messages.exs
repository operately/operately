defmodule Operately.Repo.Migrations.CreateSubscriptionsListForExistingMessages do
  use Ecto.Migration

  def up do
    Operately.Data.Change029CreateSubscriptionsListForMessages.run()
  end

  def down do

  end
end

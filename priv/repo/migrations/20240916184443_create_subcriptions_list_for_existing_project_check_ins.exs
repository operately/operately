defmodule Operately.Repo.Migrations.CreateSubcriptionsListForExistingProjectCheckIns do
  use Ecto.Migration

  def up do
    Operately.Data.Chenge027CreateSubscriptionsListForCheckIns.run()
  end

  def down do

  end
end

defmodule Operately.Repo.Migrations.CreateAccessBindingsBetweenResourceHubsAndCompanyMembers do
  use Ecto.Migration

  def up do
    Operately.Data.Change043CreateAccessBindingsBetweenResourceHubsAndPeople.run()
  end

  def down do

  end
end

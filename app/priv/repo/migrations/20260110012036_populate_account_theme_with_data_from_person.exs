defmodule Operately.Repo.Migrations.PopulateAccountThemeWithDataFromPerson do
  use Ecto.Migration

  def up do
    Operately.Data.Change091MoveThemeFromPeopleToAccounts.run()
  end

  def down do

  end
end

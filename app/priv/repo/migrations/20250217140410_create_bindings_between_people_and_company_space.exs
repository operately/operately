defmodule Operately.Repo.Migrations.CreateBindingsBetweenPeopleAndCompanySpace do
  use Ecto.Migration

  def up do
    Operately.Data.Change050CreateBindingsBetweenPeopleAndCompanySpace.run()
  end

  def down do
  end
end

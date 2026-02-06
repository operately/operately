defmodule Operately.Repo.Migrations.UpdateCompanyAdminBindingsToAdminAccess do
  use Ecto.Migration

  def up do
    Operately.Data.Change094UpdateCompanyAdminBindingsToAdminAccess.run()
  end

  def down do
  end
end

defmodule Operately.Repo.Migrations.RenameCompanySpaceToGeneral do
  use Ecto.Migration

  def up do
    Operately.Data.Change055RenameCompanySpaceToGeneral.run()
  end
end

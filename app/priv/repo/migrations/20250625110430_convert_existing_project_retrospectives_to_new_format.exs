defmodule Operately.Repo.Migrations.ConvertExistingProjectRetrospectivesToNewFormat do
  use Ecto.Migration

  def up do
    Operately.Data.Change061ConvertRetrospectiveContent.run()
  end

  def down do
  end
end

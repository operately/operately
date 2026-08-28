defmodule Operately.Repo.Migrations.DismissProductReleaseV180ForAllPeople do
  use Ecto.Migration

  def up do
    Operately.Data.Change115DismissProductReleaseV180.run()
  end

  def down do
    :ok
  end
end

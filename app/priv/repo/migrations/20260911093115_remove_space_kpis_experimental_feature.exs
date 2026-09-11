defmodule Operately.Repo.Migrations.RemoveSpaceKpisExperimentalFeature do
  use Ecto.Migration

  def up do
    Operately.Data.Change116RemoveSpaceKpisExperimentalFeature.run()
  end

  def down do
    :ok
  end
end

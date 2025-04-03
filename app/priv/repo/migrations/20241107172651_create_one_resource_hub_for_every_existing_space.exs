defmodule Operately.Repo.Migrations.CreateOneResourceHubForEveryExistingSpace do
  use Ecto.Migration

  def up do
    Operately.Data.Change041CreateOneResourceHubForEachExistingSpace.run()
  end

  def down do

  end
end

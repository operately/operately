defmodule Operately.Repo.Migrations.AddDefaultTaskStatusesToProject do
  use Ecto.Migration

  def up do
    Operately.Data.Change087PopulateDefaultTaskStatuses.run()
  end

  def down do

  end
end

defmodule Operately.Repo.Migrations.MigrateProjectKeyResourcesToResourceHubLinks do
  use Ecto.Migration

  def up do
    Operately.Data.Change102MigrateProjectKeyResourcesToResourceHubLinks.run()
  end

  def down do
    :ok
  end
end

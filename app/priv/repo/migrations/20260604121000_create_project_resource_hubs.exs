defmodule Operately.Repo.Migrations.CreateProjectResourceHubs do
  use Ecto.Migration

  def change do
    Operately.Data.Change101CreateProjectResourceHubs.run()
  end
end

defmodule Operately.Repo.Migrations.AddTypeToUpdates do
  use Ecto.Migration

  def change do
    alter table(:updates) do
      add :type, :string
    end
  end
end

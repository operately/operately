defmodule Operately.Repo.Migrations.AddNameToResourceFiles do
  use Ecto.Migration

  def change do
    alter table(:resource_files) do
      add :name, :string
    end
  end
end

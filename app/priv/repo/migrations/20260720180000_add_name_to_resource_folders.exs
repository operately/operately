defmodule Operately.Repo.Migrations.AddNameToResourceFolders do
  use Ecto.Migration

  def change do
    alter table(:resource_folders) do
      add :name, :string
    end
  end
end

defmodule Operately.Repo.Migrations.RequireNameOnResourceFolders do
  use Ecto.Migration

  def change do
    alter table(:resource_folders) do
      modify :name, :string, null: false
    end
  end
end

defmodule Operately.Repo.Migrations.RemoveDescriptionFieldFromFolder do
  use Ecto.Migration

  def change do
    alter table(:resource_folders) do
      remove :description
    end
  end
end

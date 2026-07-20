defmodule Operately.Repo.Migrations.AddNameToResourceLinks do
  use Ecto.Migration

  def change do
    alter table(:resource_links) do
      add :name, :string
    end
  end
end

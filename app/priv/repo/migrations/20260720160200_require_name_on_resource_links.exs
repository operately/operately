defmodule Operately.Repo.Migrations.RequireNameOnResourceLinks do
  use Ecto.Migration

  def change do
    alter table(:resource_links) do
      modify :name, :string, null: false
    end
  end
end

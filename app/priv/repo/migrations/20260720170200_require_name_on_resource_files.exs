defmodule Operately.Repo.Migrations.RequireNameOnResourceFiles do
  use Ecto.Migration

  def change do
    alter table(:resource_files) do
      modify :name, :string, null: false
    end
  end
end

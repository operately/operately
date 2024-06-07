defmodule Operately.Repo.Migrations.CreateGroups do
  use Ecto.Migration

  def change do
    create table(:access_groups, primary_key: false) do
      add :id, :binary_id, primary_key: true

      timestamps()
    end
  end
end

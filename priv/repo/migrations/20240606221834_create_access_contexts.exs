defmodule Operately.Repo.Migrations.CreateAccessContexts do
  use Ecto.Migration

  def change do
    create table(:access_contexts, primary_key: false) do
      add :id, :binary_id, primary_key: true

      timestamps()
    end
  end
end

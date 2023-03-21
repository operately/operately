defmodule Operately.Repo.Migrations.CreateOwnerships do
  use Ecto.Migration

  def change do
    create table(:ownerships, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :target, :uuid
      add :target_type, :string
      add :person_id, :uuid

      timestamps()
    end
  end
end

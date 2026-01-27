defmodule Operately.Repo.Migrations.CreateSystemSettings do
  use Ecto.Migration

  def change do
    create table(:system_settings, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :key, :string, null: false, default: "global"
      add :data, :map, null: false, default: %{}
      add :secrets, :binary, null: false

      timestamps()
    end

    create unique_index(:system_settings, [:key])
  end
end

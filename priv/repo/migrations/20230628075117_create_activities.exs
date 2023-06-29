defmodule Operately.Repo.Migrations.CreateActivities do
  use Ecto.Migration

  def change do
    create table(:activities, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :action_type, :string
      add :resource_type, :string
      add :resource_id, :uuid

      timestamps()
    end
  end
end

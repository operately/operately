defmodule Operately.Repo.Migrations.AddPreviousAndNewHealthToUpdates do
  use Ecto.Migration

  def change do
    alter table(:updates) do
      add :previous_health, :string, default: "unknown"
      add :new_health, :string, default: "unknown"
    end
  end
end

defmodule Operately.Repo.Migrations.AddEventDataToActivities do
  use Ecto.Migration

  def change do
    alter table(:activities) do
      add :event_data, :map
    end
  end
end

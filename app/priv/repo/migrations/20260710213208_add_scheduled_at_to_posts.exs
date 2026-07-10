defmodule Operately.Repo.Migrations.AddScheduledAtToPosts do
  use Ecto.Migration

  def change do
    alter table(:project_check_ins) do
      add :scheduled_at, :utc_datetime
    end

    alter table(:goal_updates) do
      add :scheduled_at, :utc_datetime
    end

    alter table(:messages) do
      add :scheduled_at, :utc_datetime
    end
  end
end

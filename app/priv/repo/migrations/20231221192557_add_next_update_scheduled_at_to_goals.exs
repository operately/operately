defmodule Operately.Repo.Migrations.AddNextUpdateScheduledAtToGoals do
  use Ecto.Migration

  def change do
    alter table(:goals) do
      add :next_update_scheduled_at, :utc_datetime, default: fragment("now()"), null: false
    end
  end
end

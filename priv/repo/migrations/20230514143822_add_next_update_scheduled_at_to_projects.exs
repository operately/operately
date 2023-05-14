defmodule Operately.Repo.Migrations.AddNextUpdateScheduledAtToProjects do
  use Ecto.Migration

  def change do
    alter table(:projects) do
      add :next_update_scheduled_at, :utc_datetime
    end
  end
end

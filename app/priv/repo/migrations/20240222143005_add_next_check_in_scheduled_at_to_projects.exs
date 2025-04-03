defmodule Operately.Repo.Migrations.AddNextCheckInScheduledAtToProjects do
  use Ecto.Migration

  def change do
    alter table(:projects) do
      add :next_check_in_scheduled_at, :utc_datetime
    end
  end
end

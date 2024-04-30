defmodule Operately.Repo.Migrations.AddSuspendedAtToPeople do
  use Ecto.Migration

  def change do
    alter table(:people) do
      add :suspended_at, :utc_datetime, default: nil
    end
  end
end

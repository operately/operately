defmodule Operately.Repo.Migrations.AddArchivedAtToTasks do
  use Ecto.Migration

  def change do
    alter table(:tasks) do
      add :archived_at, :naive_datetime
    end
  end
end

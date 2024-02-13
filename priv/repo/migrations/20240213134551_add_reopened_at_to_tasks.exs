defmodule Operately.Repo.Migrations.AddReopenedAtToTasks do
  use Ecto.Migration

  def change do
    alter table(:tasks) do
      add :reopened_at, :utc_datetime
    end
  end
end

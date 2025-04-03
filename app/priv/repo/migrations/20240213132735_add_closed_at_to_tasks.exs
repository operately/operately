defmodule Operately.Repo.Migrations.AddClosedAtToTasks do
  use Ecto.Migration

  def change do
    alter table(:tasks) do
      add :closed_at, :utc_datetime
    end
  end
end

defmodule Operately.Repo.Migrations.AddStartedAtAndDeadlineToProjects do
  use Ecto.Migration

  def change do
    alter table(:projects) do
      add :started_at, :utc_datetime
      add :deadline, :utc_datetime
    end
  end
end

defmodule Operately.Repo.Migrations.AddPublishedAtDateForMessages do
  use Ecto.Migration

  def change do
    alter table(:messages) do
      add :published_at, :utc_datetime
    end
  end
end

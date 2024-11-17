defmodule Operately.Repo.Migrations.AddDeletedAtToMessages do
  use Ecto.Migration

  def change do
    alter table(:messages) do
      add :deleted_at, :utc_datetime_usec
    end
  end
end

defmodule Operately.Repo.Migrations.AddDeletedAtToGroups do
  use Ecto.Migration

  def change do
    alter table(:groups) do
      add :deleted_at, :utc_datetime_usec
    end
  end
end

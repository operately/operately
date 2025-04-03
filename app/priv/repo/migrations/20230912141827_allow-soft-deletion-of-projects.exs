defmodule Operately.Repo.Migrations.AllowSoftDeletionOfProjects do
  use Ecto.Migration

  def change do
    alter table(:projects) do
      add(:deleted_at, :utc_datetime_usec, [])
    end
  end
end

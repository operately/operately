defmodule Operately.Repo.Migrations.AllowSoftDeletionOfMilestones do
  use Ecto.Migration

  def change do
    alter table(:project_milestones) do
      add(:deleted_at, :utc_datetime_usec, [])
    end
  end
end

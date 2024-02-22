defmodule Operately.Repo.Migrations.AddAcknowledgedByAndAcknowledgedAtToProjectCheckIns do
  use Ecto.Migration

  def change do
    alter table(:project_check_ins) do
      add :acknowledged_by_id, references(:people, type: :binary_id)
      add :acknowledged_at, :utc_datetime
    end
  end
end

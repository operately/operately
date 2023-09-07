defmodule Operately.Repo.Migrations.AddDueDateToPhaseHistory do
  use Ecto.Migration

  def change do
    alter table(:project_phase_history) do
      add :due_date, :utc_datetime
    end
  end
end

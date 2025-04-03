defmodule Operately.Repo.Migrations.CreateProjectPhaseHistory do
  use Ecto.Migration

  def change do
    create table(:project_phase_history, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :phase, :string
      add :start_time, :utc_datetime
      add :end_time, :utc_datetime
      add :project_id, references(:projects, on_delete: :nothing, type: :binary_id)

      timestamps()
    end

    create index(:project_phase_history, [:project_id])
  end
end

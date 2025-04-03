defmodule Operately.Repo.Migrations.RenameDueDateToDueTime do
  use Ecto.Migration

  def change do
    rename table(:project_phase_history), :due_date, to: :due_time
  end
end

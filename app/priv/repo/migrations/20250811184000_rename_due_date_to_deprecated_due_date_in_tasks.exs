defmodule Operately.Repo.Migrations.RenameDueDateToDeprecatedDueDateInTasks do
  use Ecto.Migration

  def change do
    rename table(:tasks), :due_date, to: :deprecated_due_date
  end
end

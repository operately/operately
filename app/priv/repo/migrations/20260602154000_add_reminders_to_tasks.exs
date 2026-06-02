defmodule Operately.Repo.Migrations.AddRemindersToTasks do
  use Ecto.Migration

  def up do
    alter table(:tasks) do
      add :reminders, {:array, :jsonb}, default: [], null: false
    end
  end

  def down do
    alter table(:tasks) do
      remove :reminders
    end
  end
end

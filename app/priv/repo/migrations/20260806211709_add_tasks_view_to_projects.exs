defmodule Operately.Repo.Migrations.AddTasksViewToProjects do
  use Ecto.Migration

  def change do
    alter table(:projects) do
      add :tasks_view, :string, null: false, default: "list"
    end
  end
end

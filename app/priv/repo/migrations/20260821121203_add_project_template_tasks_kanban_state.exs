defmodule Operately.Repo.Migrations.AddProjectTemplateTasksKanbanState do
  use Ecto.Migration

  def change do
    alter table(:project_templates) do
      add :tasks_kanban_state, :map, default: %{}, null: false
    end

    alter table(:project_template_milestones) do
      add :tasks_kanban_state, :map, default: %{}, null: false
    end
  end
end

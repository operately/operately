defmodule Operately.Repo.Migrations.RemoveProjectTemplateTasksKanbanState do
  use Ecto.Migration

  def change do
    alter table(:project_templates) do
      remove :tasks_kanban_state, :map, default: %{}, null: false
    end

    alter table(:project_template_milestones) do
      remove :tasks_kanban_state, :map, default: %{}, null: false
    end
  end
end

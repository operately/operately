defmodule Operately.Repo.Migrations.AddProjectTemplateDataModel do
  use Ecto.Migration

  def change do
    create table(:project_templates, primary_key: false) do
      add :id, :binary_id, primary_key: true

      add :company_id, references(:companies, type: :binary_id, on_delete: :delete_all),
        null: false

      add :space_id, references(:groups, type: :binary_id, on_delete: :delete_all), null: false
      add :creator_id, references(:people, type: :binary_id, on_delete: :nilify_all)
      add :source_project_id, references(:projects, type: :binary_id, on_delete: :nilify_all)

      add :name, :string, null: false
      add :description, :map
      add :duration_days, :integer
      add :task_statuses, {:array, :jsonb}, default: [], null: false
      add :milestones_ordering_state, {:array, :string}, default: [], null: false
      add :tasks_kanban_state, :map, default: %{}, null: false

      add :archived_at, :utc_datetime_usec
      add :deleted_at, :utc_datetime_usec

      timestamps()
    end

    create index(:project_templates, [:company_id, :deleted_at, :archived_at])
    create index(:project_templates, [:space_id, :deleted_at, :archived_at])
    create index(:project_templates, [:creator_id])
    create index(:project_templates, [:source_project_id])

    create constraint(:project_templates, :project_templates_duration_days_non_negative,
             check: "duration_days IS NULL OR duration_days >= 0"
           )

    create table(:project_template_milestones, primary_key: false) do
      add :id, :binary_id, primary_key: true

      add :project_template_id,
          references(:project_templates, type: :binary_id, on_delete: :delete_all),
          null: false

      add :title, :string, null: false
      add :description, :map
      add :due_offset_days, :integer
      add :tasks_kanban_state, :map, default: %{}, null: false
      add :tasks_ordering_state, {:array, :string}, default: [], null: false

      timestamps()
    end

    create index(:project_template_milestones, [:project_template_id])

    create constraint(
             :project_template_milestones,
             :project_template_milestones_due_offset_days_non_negative,
             check: "due_offset_days IS NULL OR due_offset_days >= 0"
           )

    create table(:project_template_tasks, primary_key: false) do
      add :id, :binary_id, primary_key: true

      add :project_template_id,
          references(:project_templates, type: :binary_id, on_delete: :delete_all),
          null: false

      add :project_template_milestone_id,
          references(:project_template_milestones, type: :binary_id, on_delete: :delete_all)

      add :name, :string, null: false
      add :description, :map, null: false
      add :priority, :string
      add :size, :string
      add :due_offset_days, :integer
      add :reminders, {:array, :jsonb}, default: [], null: false
      add :task_status, :map

      timestamps()
    end

    create index(:project_template_tasks, [:project_template_id])
    create index(:project_template_tasks, [:project_template_milestone_id])

    create constraint(
             :project_template_tasks,
             :project_template_tasks_due_offset_days_non_negative,
             check: "due_offset_days IS NULL OR due_offset_days >= 0"
           )

    alter table(:projects) do
      add :source_template_id,
          references(:project_templates, type: :binary_id, on_delete: :nilify_all)
    end

    create index(:projects, [:source_template_id])
  end
end

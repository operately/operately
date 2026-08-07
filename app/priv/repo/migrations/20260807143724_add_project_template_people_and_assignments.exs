defmodule Operately.Repo.Migrations.AddProjectTemplatePeopleAndAssignments do
  use Ecto.Migration

  def change do
    create table(:project_template_people, primary_key: false) do
      add :id, :binary_id, primary_key: true

      add :project_template_id,
          references(:project_templates, type: :binary_id, on_delete: :delete_all),
          null: false

      add :person_id, references(:people, type: :binary_id, on_delete: :nilify_all)
      add :role, :string, null: false, default: "contributor"
      add :responsibility, :text
      add :access_level, :integer, null: false, default: 0

      timestamps()
    end

    create index(:project_template_people, [:project_template_id])
    create index(:project_template_people, [:person_id])

    create table(:project_template_task_assignments, primary_key: false) do
      add :id, :binary_id, primary_key: true

      add :project_template_id,
          references(:project_templates, type: :binary_id, on_delete: :delete_all),
          null: false

      add :project_template_task_id,
          references(:project_template_tasks, type: :binary_id, on_delete: :delete_all),
          null: false

      add :project_template_person_id,
          references(:project_template_people, type: :binary_id, on_delete: :delete_all),
          null: false

      timestamps()
    end

    create index(:project_template_task_assignments, [:project_template_id])
    create index(:project_template_task_assignments, [:project_template_task_id])
    create index(:project_template_task_assignments, [:project_template_person_id])
  end
end

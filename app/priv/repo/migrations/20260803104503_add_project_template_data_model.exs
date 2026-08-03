defmodule Operately.Repo.Migrations.AddProjectTemplateDataModel do
  use Ecto.Migration

  def change do
    alter table(:projects) do
      add :kind, :string, null: false, default: "project"
      add :template_duration_days, :integer
    end

    alter table(:project_milestones) do
      add :template_due_offset_days, :integer
    end

    alter table(:tasks) do
      add :template_due_offset_days, :integer
    end

    create index(:projects, [:company_id, :group_id, :kind, :deleted_at],
             name: :projects_company_space_kind_deletion_index
           )
  end
end

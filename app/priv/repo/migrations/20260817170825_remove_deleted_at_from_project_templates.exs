defmodule Operately.Repo.Migrations.RemoveDeletedAtFromProjectTemplates do
  use Ecto.Migration

  def up do
    drop index(:project_templates, [:company_id, :deleted_at, :archived_at])
    drop index(:project_templates, [:space_id, :deleted_at, :archived_at])

    alter table(:project_templates) do
      remove :deleted_at
    end

    create index(:project_templates, [:company_id, :archived_at])
    create index(:project_templates, [:space_id, :archived_at])
  end

  def down do
    drop index(:project_templates, [:company_id, :archived_at])
    drop index(:project_templates, [:space_id, :archived_at])

    alter table(:project_templates) do
      add :deleted_at, :utc_datetime_usec
    end

    create index(:project_templates, [:company_id, :deleted_at, :archived_at])
    create index(:project_templates, [:space_id, :deleted_at, :archived_at])
  end
end

defmodule Operately.Repo.Migrations.AddPositionToProjectMilestones do
  use Ecto.Migration

  def up do
    alter table(:project_milestones) do
      add :position, :integer, null: false, default: 0
    end

    execute("""
      WITH ranked AS (
        SELECT id, ROW_NUMBER() OVER (PARTITION BY project_id ORDER BY inserted_at, id) AS rn
        FROM project_milestones
      )
      UPDATE project_milestones AS pm
      SET position = ranked.rn
      FROM ranked
      WHERE pm.id = ranked.id
    """)

    execute("ALTER TABLE project_milestones ALTER COLUMN position DROP DEFAULT")
  end

  def down do
    alter table(:project_milestones) do
      remove :position
    end
  end
end

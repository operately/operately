defmodule Operately.Repo.Migrations.HardenSearchIndexMaintenance do
  use Ecto.Migration

  # Idempotent: prod may already have applied these changes under version
  # 20260720180000 before this migration was renamed to 20260720180050 in
  # commit aa1b358b1.
  def up do
    execute "ALTER TABLE search_entries ALTER COLUMN source_updated_at SET NOT NULL"

    execute """
    ALTER TABLE search_index_runs
    ADD COLUMN IF NOT EXISTS superseded_count bigint NOT NULL DEFAULT 0
    """
  end

  def down do
    execute "ALTER TABLE search_index_runs DROP COLUMN IF EXISTS superseded_count"

    execute "ALTER TABLE search_entries ALTER COLUMN source_updated_at DROP NOT NULL"
  end
end

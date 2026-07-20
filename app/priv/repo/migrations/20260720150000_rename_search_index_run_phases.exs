defmodule Operately.Repo.Migrations.RenameSearchIndexRunPhases do
  use Ecto.Migration

  def up do
    execute "ALTER TABLE search_index_runs ALTER COLUMN phase SET DEFAULT 'source_scan'"

    execute """
    UPDATE search_index_runs
    SET phase = CASE phase
      WHEN 'sources' THEN 'source_scan'
      WHEN 'orphans' THEN 'index_scan'
    END
    WHERE phase IN ('sources', 'orphans')
    """
  end

  def down do
    execute "ALTER TABLE search_index_runs ALTER COLUMN phase SET DEFAULT 'sources'"

    execute """
    UPDATE search_index_runs
    SET phase = CASE phase
      WHEN 'source_scan' THEN 'sources'
      WHEN 'index_scan' THEN 'orphans'
    END
    WHERE phase IN ('source_scan', 'index_scan')
    """
  end
end

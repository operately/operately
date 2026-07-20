defmodule Operately.Repo.Migrations.HardenSearchIndexMaintenance do
  use Ecto.Migration

  def up do
    execute "ALTER TABLE search_entries ALTER COLUMN source_updated_at SET NOT NULL"

    alter table(:search_index_runs) do
      add :superseded_count, :bigint, null: false, default: 0
    end
  end

  def down do
    alter table(:search_index_runs) do
      remove :superseded_count
    end

    execute "ALTER TABLE search_entries ALTER COLUMN source_updated_at DROP NOT NULL"
  end
end

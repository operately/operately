defmodule Operately.Repo.Migrations.AddSearchIndexingFoundation do
  use Ecto.Migration

  def up do
    # `unaccent` enables accent-insensitive terms
    execute "CREATE EXTENSION IF NOT EXISTS unaccent"
    # `pg_trgm` enables fuzzy and substring searches
    execute "CREATE EXTENSION IF NOT EXISTS pg_trgm"

    # A text-search configuration defines how PostgreSQL turns document tokens into searchable terms.
    # Start with the language-neutral `simple` configuration, which does not stem words, and copy it
    # into an Operately-owned configuration so the next statement can add accent removal. PostgreSQL
    # has no `CREATE TEXT SEARCH CONFIGURATION IF NOT EXISTS`, so the catalog query provides that guard.
    execute """
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1
        FROM pg_catalog.pg_ts_config config
        JOIN pg_catalog.pg_namespace namespace ON namespace.oid = config.cfgnamespace
        WHERE namespace.nspname = 'public' AND config.cfgname = 'operately'
      ) THEN
        CREATE TEXT SEARCH CONFIGURATION public.operately (COPY = pg_catalog.simple);
      END IF;
    END
    $$
    """

    # Remove accents from word-like tokens before indexing them with the non-stemming `simple` dictionary.
    execute """
    ALTER TEXT SEARCH CONFIGURATION public.operately
      ALTER MAPPING FOR word, hword, hword_part
      WITH public.unaccent, pg_catalog.simple
    """

    create table(:search_entries, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :source_type, :string, null: false
      add :source_id, :binary_id, null: false

      add :company_id, references(:companies, type: :binary_id, on_delete: :delete_all),
        null: false

      add :access_context_id,
          references(:access_contexts, type: :binary_id, on_delete: :delete_all),
          null: false

      add :resource_hub_id, references(:resource_hubs, type: :binary_id)
      add :space_id, references(:groups, type: :binary_id)
      add :project_id, references(:projects, type: :binary_id)
      add :goal_id, references(:goals, type: :binary_id)

      add :title, :text, null: false
      add :normalized_title, :text, null: false
      add :body, :text, null: false, default: ""
      add :body_kind, :string
      add :state, :string
      add :source_inserted_at, :naive_datetime_usec
      add :source_updated_at, :naive_datetime_usec

      timestamps()
    end

    # Add one database-managed search column derived from the application-written title and body.
    # PostgreSQL recalculates it whenever either source column changes, and the application cannot write
    # it directly. Title terms receive weight A and body terms weight B so title matches rank higher;
    # storing the result allows PostgreSQL to index it with GIN.
    execute """
    ALTER TABLE search_entries
      ADD COLUMN search_vector tsvector
      GENERATED ALWAYS AS (
        setweight(to_tsvector('public.operately'::regconfig, coalesce(title, '')), 'A') ||
        setweight(to_tsvector('public.operately'::regconfig, coalesce(body, '')), 'B')
      ) STORED
    """

    create unique_index(:search_entries, [:source_type, :source_id])
    create index(:search_entries, [:company_id])
    create index(:search_entries, [:access_context_id])
    create index(:search_entries, [:company_id, :resource_hub_id])
    create index(:search_entries, [:company_id, :space_id])
    create index(:search_entries, [:company_id, :project_id])
    create index(:search_entries, [:company_id, :goal_id])

    execute "CREATE INDEX search_entries_search_vector_index ON search_entries USING GIN (search_vector)"

    execute "CREATE INDEX search_entries_normalized_title_trgm_index ON search_entries USING GIN (normalized_title gin_trgm_ops)"

    create table(:search_index_runs, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :source_type, :string, null: false
      add :kind, :string, null: false
      add :status, :string, null: false, default: "pending"
      add :phase, :string, null: false, default: "sources"
      add :cursor, :binary_id
      add :processed_count, :bigint, null: false, default: 0
      add :inserted_count, :bigint, null: false, default: 0
      add :updated_count, :bigint, null: false, default: 0
      add :unchanged_count, :bigint, null: false, default: 0
      add :skipped_count, :bigint, null: false, default: 0
      add :failed_count, :bigint, null: false, default: 0
      add :deleted_orphan_count, :bigint, null: false, default: 0
      add :last_error, :text
      add :started_at, :utc_datetime_usec
      add :completed_at, :utc_datetime_usec

      timestamps()
    end

    create index(:search_index_runs, [:status, :inserted_at])

    execute """
    CREATE UNIQUE INDEX search_index_runs_one_active_per_source_index
      ON search_index_runs (source_type)
      WHERE status IN ('pending', 'running')
    """
  end

  def down do
    drop table(:search_index_runs)
    drop table(:search_entries)
    execute "DROP TEXT SEARCH CONFIGURATION IF EXISTS public.operately"
  end
end

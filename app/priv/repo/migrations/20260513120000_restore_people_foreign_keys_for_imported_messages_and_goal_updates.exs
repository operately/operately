defmodule Operately.Repo.Migrations.RestorePeopleForeignKeysForImportedMessagesAndGoalUpdates do
  use Ecto.Migration

  def up do
    # Clear orphaned person references before restoring the foreign keys. If an
    # imported author/acknowledger no longer exists in `people`, we keep the
    # row and null the reference so the new constraints can be added safely.
    execute("""
      UPDATE messages
      SET author_id = NULL
      WHERE author_id IS NOT NULL
        AND NOT EXISTS (
          SELECT 1
          FROM people
          WHERE people.id = messages.author_id
        );
    """)

    execute("""
      UPDATE goal_updates
      SET author_id = NULL
      WHERE author_id IS NOT NULL
        AND NOT EXISTS (
          SELECT 1
          FROM people
          WHERE people.id = goal_updates.author_id
        );
    """)

    execute("""
      UPDATE goal_updates
      SET acknowledged_by_id = NULL,
          acknowledged_at = NULL
      WHERE acknowledged_by_id IS NOT NULL
        AND NOT EXISTS (
          SELECT 1
          FROM people
          WHERE people.id = goal_updates.acknowledged_by_id
        );
    """)

    # Create indexes for the foreign keys we're about to add
    create_if_not_exists index(:goal_updates, [:author_id])
    create_if_not_exists index(:goal_updates, [:acknowledged_by_id])

    execute("""
      ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_author_id_fkey;
    """)

    execute("""
      ALTER TABLE messages
      ADD CONSTRAINT messages_author_id_fkey
      FOREIGN KEY (author_id) REFERENCES public.people(id) ON DELETE SET NULL;
    """)

    execute("""
      ALTER TABLE goal_updates DROP CONSTRAINT IF EXISTS goal_updates_author_id_fkey;
    """)

    execute("""
      ALTER TABLE goal_updates
      ADD CONSTRAINT goal_updates_author_id_fkey
      FOREIGN KEY (author_id) REFERENCES public.people(id) ON DELETE SET NULL;
    """)

    execute("""
      ALTER TABLE goal_updates DROP CONSTRAINT IF EXISTS goal_updates_acknowledged_by_id_fkey;
    """)

    execute("""
      ALTER TABLE goal_updates
      ADD CONSTRAINT goal_updates_acknowledged_by_id_fkey
      FOREIGN KEY (acknowledged_by_id) REFERENCES public.people(id) ON DELETE SET NULL;
    """)
  end

  def down do
    execute("""
      ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_author_id_fkey;
    """)

    execute("""
      ALTER TABLE goal_updates DROP CONSTRAINT IF EXISTS goal_updates_author_id_fkey;
    """)

    execute("""
      ALTER TABLE goal_updates DROP CONSTRAINT IF EXISTS goal_updates_acknowledged_by_id_fkey;
    """)

    drop_if_exists index(:goal_updates, [:author_id])
    drop_if_exists index(:goal_updates, [:acknowledged_by_id])
  end
end

defmodule Operately.Repo.Migrations.AddCyclePreventionFunctionToPeople do
  use Ecto.Migration

  def up do
    execute """
    CREATE OR REPLACE FUNCTION check_manager_cycle()
    RETURNS TRIGGER AS $$
    BEGIN
        IF NEW.manager_id IS NOT NULL THEN
            IF NEW.id = NEW.manager_id OR EXISTS (
                WITH RECURSIVE managers AS (
                    SELECT id, manager_id FROM people WHERE id = NEW.manager_id
                    UNION ALL
                    SELECT p.id, p.manager_id FROM people p
                    JOIN managers m ON p.id = m.manager_id
                )
                SELECT 1 FROM managers WHERE id = NEW.id
            ) THEN
                RAISE EXCEPTION 'Cycle detected: setting this manager would create a circular reference';
            END IF;
        END IF;
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
    """

    execute """
    CREATE TRIGGER prevent_manager_cycle
    BEFORE INSERT OR UPDATE ON people
    FOR EACH ROW EXECUTE FUNCTION check_manager_cycle();
    """

    create index(:people, [:manager_id])
  end

  def down do
    execute "DROP TRIGGER prevent_manager_cycle ON people;"
    execute "DROP FUNCTION check_manager_cycle();"

    drop index(:people, [:manager_id])
  end
end

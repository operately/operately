defmodule Operately.Repo.Migrations.AddCyclePreventionFunctionToGoals do
  use Ecto.Migration

  def up do
    execute """
    CREATE OR REPLACE FUNCTION check_goal_cycle()
    RETURNS TRIGGER AS $$
    BEGIN
        IF NEW.parent_goal_id IS NOT NULL THEN
            IF NEW.id = NEW.parent_goal_id OR EXISTS (
                WITH RECURSIVE ancestors AS (
                    SELECT id, parent_goal_id FROM goals WHERE id = NEW.parent_goal_id
                    UNION ALL
                    SELECT g.id, g.parent_goal_id FROM goals g
                    JOIN ancestors a ON g.id = a.parent_goal_id
                )
                SELECT 1 FROM ancestors WHERE id = NEW.id
            ) THEN
                RAISE EXCEPTION 'Cycle detected: setting this parent would create a circular reference';
            END IF;
        END IF;
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
    """

    execute """
    CREATE TRIGGER prevent_goal_cycle
    BEFORE INSERT OR UPDATE ON goals
    FOR EACH ROW EXECUTE FUNCTION check_goal_cycle();
    """

    create index(:goals, [:parent_goal_id])
  end

  def down do
    execute "DROP TRIGGER prevent_goal_cycle ON goals;"
    execute "DROP FUNCTION check_goal_cycle();"

    drop index(:goals, [:parent_goal_id])
  end
end

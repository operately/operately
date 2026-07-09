defmodule Operately.Repo.Migrations.AddCyclePreventionFunctionToResourceNodes do
  use Ecto.Migration

  def up do
    execute """
    CREATE OR REPLACE FUNCTION check_resource_node_folder_cycle()
    RETURNS TRIGGER AS $$
    DECLARE
        moving_folder_id uuid;
    BEGIN
        IF NEW.parent_folder_id IS NOT NULL AND NEW.type = 'folder' THEN
            SELECT id INTO moving_folder_id
            FROM resource_folders
            WHERE node_id = NEW.id;

            IF moving_folder_id IS NOT NULL AND (
                moving_folder_id = NEW.parent_folder_id OR EXISTS (
                    WITH RECURSIVE ancestors AS (
                        SELECT rf.id, n.parent_folder_id
                        FROM resource_folders rf
                        JOIN resource_nodes n ON rf.node_id = n.id
                        WHERE rf.id = NEW.parent_folder_id
                        UNION ALL
                        SELECT rf.id, n.parent_folder_id
                        FROM resource_folders rf
                        JOIN resource_nodes n ON rf.node_id = n.id
                        JOIN ancestors a ON rf.id = a.parent_folder_id
                        WHERE a.parent_folder_id IS NOT NULL
                    )
                    SELECT 1 FROM ancestors WHERE id = moving_folder_id
                )
            ) THEN
                RAISE EXCEPTION 'Cycle detected: setting this parent folder would create a circular reference';
            END IF;
        END IF;
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
    """

    execute """
    CREATE TRIGGER prevent_resource_node_folder_cycle
    BEFORE INSERT OR UPDATE ON resource_nodes
    FOR EACH ROW EXECUTE FUNCTION check_resource_node_folder_cycle();
    """
  end

  def down do
    execute "DROP TRIGGER prevent_resource_node_folder_cycle ON resource_nodes;"
    execute "DROP FUNCTION check_resource_node_folder_cycle();"
  end
end

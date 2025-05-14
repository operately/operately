defmodule Operately.Data.Change053PopulateGoalLastUpdateStatus do
  def run do
    sql = """
    UPDATE goals
    SET last_update_status = (
      SELECT status 
      FROM goal_updates 
      WHERE goal_updates.id = goals.last_check_in_id
    )
    WHERE goals.last_update_status IS NULL 
    AND goals.last_check_in_id IS NOT NULL;
    """

    Operately.Repo.query!(sql)
  end
end

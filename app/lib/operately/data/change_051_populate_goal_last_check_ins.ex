defmodule Operately.Data.Change051PopulateGoalLastCheckIns do
  def run do
    sql = """
    UPDATE goals
    SET last_check_in_id = latest_updates.update_id
    FROM (
      SELECT DISTINCT ON (goal_updates.goal_id)
        goal_updates.goal_id,
        goal_updates.id AS update_id
      FROM goal_updates
      ORDER BY goal_updates.goal_id, goal_updates.inserted_at DESC
    ) AS latest_updates
    WHERE goals.id = latest_updates.goal_id
    """

    Operately.Repo.query!(sql)
  end
end

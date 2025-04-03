defmodule Operately.Data.Change052PopulateGoalUpdateTimeframes do
  def run do
    sql = """
    UPDATE goal_updates
    SET timeframe = goals.timeframe
    FROM goals
    WHERE goal_updates.goal_id = goals.id;
    """

    Operately.Repo.query!(sql)
  end
end

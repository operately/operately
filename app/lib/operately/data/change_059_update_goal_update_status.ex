defmodule Operately.Data.Change059UpdateGoalUpdateStatus do
  alias Operately.Repo

  def run do
    Repo.transaction(fn ->
      unexpected_statuses = find_unexpected_statuses()

      if length(unexpected_statuses) > 0 do
        statuses_str = Enum.join(unexpected_statuses, ", ")
        raise "Found unexpected goal update statuses: #{statuses_str}"
      end

      update_statuses()
    end)
  end

  defp find_unexpected_statuses do
    sql = """
    SELECT DISTINCT status
    FROM goal_updates
    WHERE status IS NOT NULL
    AND status NOT IN ('on_track', 'caution', 'concern', 'issue', 'pending')
    """

    %{rows: rows} = Repo.query!(sql)
    Enum.map(rows, fn [status] -> status end)
  end

  defp update_statuses do
    # Update 'issue' statuses to 'off_track'
    update_issue_sql = """
    UPDATE goal_updates
    SET status = 'off_track'
    WHERE status = 'issue'
    """

    Repo.query!(update_issue_sql)

    # Update 'concern' statuses to 'caution'
    update_concern_sql = """
    UPDATE goal_updates
    SET status = 'caution'
    WHERE status = 'concern'
    """

    Repo.query!(update_concern_sql)

    # Update 'pending' statuses to 'on_track'
    update_pending_sql = """
    UPDATE goal_updates
    SET status = 'on_track'
    WHERE status = 'pending'
    """

    Repo.query!(update_pending_sql)
  end
end

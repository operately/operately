defmodule Operately.Data.Change060UpdateGoalsLastUpdateStatus do
  alias Operately.Repo

  def run do
    Repo.transaction(fn ->
      unexpected_statuses = find_unexpected_statuses()

      if length(unexpected_statuses) > 0 do
        statuses_str = Enum.join(unexpected_statuses, ", ")
        raise "Found unexpected goal last_update_status values: #{statuses_str}"
      end

      update_statuses()
    end)
  end

  defp find_unexpected_statuses do
    sql = """
    SELECT DISTINCT last_update_status
    FROM goals
    WHERE last_update_status IS NOT NULL
    AND last_update_status NOT IN ('on_track', 'caution', 'concern', 'issue', 'pending')
    """

    %{rows: rows} = Repo.query!(sql)
    Enum.map(rows, fn [status] -> status end)
  end

  defp update_statuses do
    # Update 'issue' statuses to 'off_track'
    update_issue_sql = """
    UPDATE goals
    SET last_update_status = 'off_track'
    WHERE last_update_status = 'issue'
    """

    Repo.query!(update_issue_sql)

    # Update 'concern' statuses to 'caution'
    update_concern_sql = """
    UPDATE goals
    SET last_update_status = 'caution'
    WHERE last_update_status = 'concern'
    """

    Repo.query!(update_concern_sql)

    # Update 'pending' statuses to 'on_track'
    update_pending_sql = """
    UPDATE goals
    SET last_update_status = 'on_track'
    WHERE last_update_status = 'pending'
    """

    Repo.query!(update_pending_sql)
  end
end

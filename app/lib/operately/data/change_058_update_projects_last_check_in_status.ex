defmodule Operately.Data.Change058UpdateProjectsLastCheckInStatus do
  alias Operately.Repo

  def run do
    Repo.transaction(fn ->
      # First, check for any unexpected statuses
      unexpected_statuses = find_unexpected_statuses()

      if length(unexpected_statuses) > 0 do
        statuses_str = Enum.join(unexpected_statuses, ", ")
        raise "Found unexpected project last_check_in_status values: #{statuses_str}"
      end

      # Update "issue" statuses to "off_track"
      update_issue_statuses()
    end)
  end

  defp find_unexpected_statuses do
    sql = """
    SELECT DISTINCT last_check_in_status
    FROM projects
    WHERE last_check_in_status IS NOT NULL
    AND last_check_in_status NOT IN ('on_track', 'caution', 'issue', 'at_risk')
    """

    %{rows: rows} = Repo.query!(sql)
    Enum.map(rows, fn [status] -> status end)
  end

  defp update_issue_statuses do
    sql = """
    UPDATE projects
    SET last_check_in_status = 'off_track'
    WHERE last_check_in_status = 'issue'
    """

    Repo.query!(sql)

    sql = """
    UPDATE projects
    SET last_check_in_status = 'off_track'
    WHERE last_check_in_status = 'at_risk'
    """

    Repo.query!(sql)
  end
end

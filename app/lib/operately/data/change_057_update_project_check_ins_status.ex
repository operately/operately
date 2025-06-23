defmodule Operately.Data.Change057UpdateProjectCheckInsStatus do
  alias Operately.Repo

  def run do
    Repo.transaction(fn ->
      # First, check for any unexpected statuses
      unexpected_statuses = find_unexpected_statuses()

      if length(unexpected_statuses) > 0 do
        statuses_str = Enum.join(unexpected_statuses, ", ")
        raise "Found unexpected project check-in statuses: #{statuses_str}"
      end

      # Update "issue" statuses to "off_track"
      update_issue_statuses()
    end)
  end

  defp find_unexpected_statuses do
    sql = """
    SELECT DISTINCT status
    FROM project_check_ins
    WHERE status NOT IN ('on_track', 'caution', 'issue')
    """

    %{rows: rows} = Repo.query!(sql)
    Enum.map(rows, fn [status] -> status end)
  end

  defp update_issue_statuses do
    sql = """
    UPDATE project_check_ins
    SET status = 'off_track'
    WHERE status = 'issue'
    """

    Repo.query!(sql)
  end
end

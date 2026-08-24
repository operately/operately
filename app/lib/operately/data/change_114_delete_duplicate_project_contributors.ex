defmodule Operately.Data.Change114DeleteDuplicateProjectContributors do
  alias Operately.Repo

  def run do
    sql = """
    WITH ranked AS (
      SELECT
        id,
        ROW_NUMBER() OVER (
          PARTITION BY project_id, person_id
          ORDER BY
            CASE role
              WHEN 'champion' THEN 3
              WHEN 'reviewer' THEN 2
              WHEN 'contributor' THEN 1
              ELSE 0
            END DESC,
            inserted_at ASC NULLS LAST,
            id ASC
        ) AS row_num
      FROM project_contributors
    )
    DELETE FROM project_contributors
    WHERE id IN (
      SELECT id
      FROM ranked
      WHERE row_num > 1
    );
    """

    Repo.query!(sql)
  end
end

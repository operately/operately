defmodule Operately.Data.Change095DeleteDuplicateSubscriptions do
  alias Operately.Repo

  def run do
    sql = """
    WITH ranked AS (
      SELECT
        id,
        ROW_NUMBER() OVER (
          PARTITION BY subscription_list_id, person_id
          ORDER BY
            CASE WHEN canceled THEN 0 ELSE 1 END DESC,
            CASE type
              WHEN 'joined' THEN 3
              WHEN 'invited' THEN 2
              WHEN 'mentioned' THEN 1
              ELSE 0
            END DESC,
            updated_at DESC NULLS LAST,
            inserted_at DESC NULLS LAST,
            id DESC
        ) AS row_num
      FROM subscriptions
    )
    DELETE FROM subscriptions
    WHERE id IN (
      SELECT id
      FROM ranked
      WHERE row_num > 1
    );
    """

    Repo.query!(sql)
  end
end

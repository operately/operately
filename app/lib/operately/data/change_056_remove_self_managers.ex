defmodule Operately.Data.Change056RemoveSelfManagers do
  def run do
    sql = """
    UPDATE people
    SET manager_id = NULL
    WHERE id = manager_id;
    """

    Operately.Repo.query!(sql)
  end
end

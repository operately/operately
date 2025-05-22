defmodule Operately.Data.Change055RenameCompanySpaceToGeneral do
  def run do
    sql = """
    UPDATE groups
    SET name = 'General'
    FROM companies
    WHERE groups.id = companies.company_space_id;
    """

    Operately.Repo.query!(sql)
  end
end

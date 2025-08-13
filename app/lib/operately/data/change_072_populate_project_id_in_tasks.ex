defmodule Operately.Data.Change072PopulateProjectIdInTasks do
  def run do
    sql = """
    UPDATE tasks
    SET project_id = project_milestones.project_id
    FROM project_milestones
    WHERE tasks.milestone_id = project_milestones.id
    AND tasks.milestone_id IS NOT NULL
    AND tasks.project_id IS NULL;
    """

    Operately.Repo.query!(sql)
  end
end

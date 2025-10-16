defmodule Operately.Repo.Migrations.PopulateCompletedAtForExistingGoalChecks do
  use Ecto.Migration

  def up do
    execute """
    UPDATE goal_checks 
    SET completed_at = NOW() 
    WHERE completed = true AND completed_at IS NULL
    """
  end

  def down do
    # No need to revert this data migration
  end
end

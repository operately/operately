defmodule Operately.Repo.Migrations.UpdateMilestoneTasksOrderingWithValidTasksList do
  use Ecto.Migration

  def up do
    Operately.Data.Change079UpdateMilestoneTasksOrderingState.run()
  end

  def down do
  end
end

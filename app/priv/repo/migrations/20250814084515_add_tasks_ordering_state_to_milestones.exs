defmodule Operately.Repo.Migrations.AddTasksOrderingStateToMilestones do
  use Ecto.Migration

  def change do
    alter table(:project_milestones) do
      add :tasks_ordering_state, {:array, :text}, default: []
    end
  end
end

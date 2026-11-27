defmodule Operately.Repo.Migrations.AddProjectAndGoalOwnershipToMessages do
  use Ecto.Migration

  def change do
    alter table(:messages) do
      add :project_id, references(:projects, type: :binary_id, on_delete: :delete_all)
      add :goal_id, references(:goals, type: :binary_id, on_delete: :delete_all)
    end

    create index(:messages, [:project_id], where: "project_id IS NOT NULL")
    create index(:messages, [:goal_id], where: "goal_id IS NOT NULL")
    create constraint(:messages, :messages_exactly_one_owner, check: "num_nonnulls(messages_board_id, project_id, goal_id) = 1")
  end
end

defmodule Operately.Repo.Migrations.AddCreatorFieldToMilestoneSchema do
  use Ecto.Migration

  def change do
    alter table(:project_milestones) do
      add :creator_id, references(:people, type: :binary_id, on_delete: :delete_all)
    end
  end
end

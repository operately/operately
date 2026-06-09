defmodule Operately.Repo.Migrations.AddDraftStateToCheckIns do
  use Ecto.Migration

  def change do
    alter table(:project_check_ins) do
      add :state, :string, null: false, default: "published"
      add :published_at, :utc_datetime
    end

    alter table(:goal_updates) do
      add :state, :string, null: false, default: "published"
      add :published_at, :utc_datetime
    end

    create index(:project_check_ins, [:project_id, :state])
    create index(:goal_updates, [:goal_id, :state])

    execute "UPDATE project_check_ins SET published_at = inserted_at WHERE published_at IS NULL",
            ""

    execute "UPDATE goal_updates SET published_at = inserted_at WHERE published_at IS NULL", ""
  end
end

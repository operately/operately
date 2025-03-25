defmodule Operately.Repo.Migrations.AddLastCheckInIdToGoals do
  use Ecto.Migration

  def change do
    alter table(:goals) do
      add :last_check_in_id, references(:goal_updates, on_delete: :nilify_all, type: :binary_id)
    end
  end
end

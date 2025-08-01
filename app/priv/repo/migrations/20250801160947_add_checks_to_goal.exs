defmodule Operately.Repo.Migrations.AddChecksToGoal do
  use Ecto.Migration

  def change do
    create table(:goal_checks) do
      add :goal_id, references(:goals, type: :binary_id, on_delete: :delete_all), null: false
      add :creator_id, references(:people, type: :binary_id, on_delete: :delete_all), null: false

      add :name, :string, null: false
      add :completed, :boolean, default: false, null: false
      add :index, :integer, null: false

      timestamps()
    end
  end
end

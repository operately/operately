defmodule Operately.Repo.Migrations.ChangeGoalCheckNameToText do
  use Ecto.Migration

  def change do
    alter table(:goal_checks) do
      modify :name, :text, from: :string
    end
  end
end

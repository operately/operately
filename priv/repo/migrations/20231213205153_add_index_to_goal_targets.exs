defmodule Operately.Repo.Migrations.AddIndexToGoals do
  use Ecto.Migration

  def change do
    alter table(:targets) do
      add :index, :integer, default: 0
    end
  end
end

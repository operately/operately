defmodule Operately.Repo.Migrations.RemoveKeyResultsAndObjectivesTables do
  use Ecto.Migration

  def change do
    drop index(:projects, [:objective_id])

    alter table(:projects) do
      remove :objective_id
    end

    drop table(:key_results)
    drop table(:objectives)
  end
end

defmodule Operately.Repo.Migrations.AddClosedAtAndClosedByIdToGoals do
  use Ecto.Migration

  def change do
    alter table(:goals) do
      add :closed_at, :utc_datetime
      add :closed_by_id, references(:people, type: :binary_id)
    end
  end
end

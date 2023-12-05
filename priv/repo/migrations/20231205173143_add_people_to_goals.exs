defmodule Operately.Repo.Migrations.AddPeopleToGoals do
  use Ecto.Migration

  def change do
    alter table(:goals) do
      add :company_id, references(:companies, type: :binary_id)
      add :champion_id, references(:people, type: :binary_id)
      add :reviewer_id, references(:people, type: :binary_id)
      add :creator_id, references(:people, type: :binary_id)

      add :deleted_at, :utc_datetime_usec, []
    end
  end
end

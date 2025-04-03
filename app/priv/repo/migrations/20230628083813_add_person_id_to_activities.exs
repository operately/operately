defmodule Operately.Repo.Migrations.AddPersonIdToActivities do
  use Ecto.Migration

  def change do
    alter table(:activities) do
      add :person_id, references(:people, type: :binary_id)
    end

    create index(:activities, [:person_id])
  end
end

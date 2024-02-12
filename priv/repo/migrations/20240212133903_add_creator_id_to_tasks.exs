defmodule Operately.Repo.Migrations.AddCreatorIdToTasks do
  use Ecto.Migration

  def change do
    alter table(:tasks) do
      add :creator_id, references(:people, type: :binary_id)
    end
  end
end

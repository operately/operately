defmodule Operately.Repo.Migrations.AddManagerIdToPeople do
  use Ecto.Migration

  def change do
    alter table(:people) do
      add :manager_id, references(:people, type: :binary_id)
    end
  end
end

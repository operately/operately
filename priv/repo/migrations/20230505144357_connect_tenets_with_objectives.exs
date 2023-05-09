defmodule Operately.Repo.Migrations.ConnectTenetsWithObjectives do
  use Ecto.Migration

  def change do
    alter table(:objectives) do
      add :tenet_id, references(:tenets, type: :binary_id)
    end

    create index(:objectives, [:tenet_id])
  end
end

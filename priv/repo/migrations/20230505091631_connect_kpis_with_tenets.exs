defmodule Operately.Repo.Migrations.ConnectKpisWithTenets do
  use Ecto.Migration

  def change do
    alter table(:kpis) do
      add :tenet_id, references(:tenets, type: :binary_id)
    end

    create index(:kpis, [:tenet_id])
  end
end

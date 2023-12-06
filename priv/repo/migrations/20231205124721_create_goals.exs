defmodule Operately.Repo.Migrations.CreateGoals do
  use Ecto.Migration

  def change do
    create table(:goals, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :name, :string
      add :group_id, references(:groups, on_delete: :nothing, type: :binary_id)

      timestamps()
    end

    create index(:goals, [:group_id])
  end
end

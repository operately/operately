defmodule Operately.Repo.Migrations.CreateKeyResults do
  use Ecto.Migration

  def change do
    create table(:key_results, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :name, :string
      add :unit, :string
      add :target, :integer
      add :objective_id, references(:objectives, on_delete: :nothing, type: :binary_id)

      timestamps()
    end

    create index(:key_results, [:objective_id])
  end
end

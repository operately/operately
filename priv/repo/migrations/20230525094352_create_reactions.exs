defmodule Operately.Repo.Migrations.CreateReactions do
  use Ecto.Migration

  def change do
    create table(:reactions, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :entity_id, :uuid
      add :entity_type, :string
      add :reaction_type, :string
      add :person_id, references(:people, on_delete: :nothing, type: :binary_id)

      timestamps()
    end

    create index(:reactions, [:person_id])
  end
end

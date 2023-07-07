defmodule Operately.Repo.Migrations.CreatePeoplePins do
  use Ecto.Migration

  def change do
    create table(:people_pins, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :pined_id, :uuid
      add :pened_type, :uuid
      add :person_id, references(:people, on_delete: :delete_all, type: :binary_id)

      timestamps()
    end

    create index(:people_pins, [:person_id])
  end
end

defmodule Operately.Repo.Migrations.AddAgentDefsTable do
  use Ecto.Migration

  def change do
    create table(:agent_defs, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :person_id, references(:people, type: :binary_id, on_delete: :delete_all), null: false
      add :definition, :text

      timestamps()
    end
  end
end

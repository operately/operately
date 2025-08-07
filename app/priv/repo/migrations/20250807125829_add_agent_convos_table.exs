defmodule Operately.Repo.Migrations.AddAgentConvosTable do
  use Ecto.Migration

  def change do
    create table(:agent_convos, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :request_id, :string, null: false
      add :goal_id, references(:goals, type: :binary_id, on_delete: :delete_all), null: true
      add :author_id, references(:people, type: :binary_id, on_delete: :delete_all), null: false

      timestamps()
    end
  end
end

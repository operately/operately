defmodule Operately.Repo.Migrations.AddProjectIdToAgentConvo do
  use Ecto.Migration

  def change do
    alter table(:agent_convos) do
      add :project_id, references(:projects, type: :binary_id, on_delete: :delete_all), null: true
    end
  end
end

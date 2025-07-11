defmodule Operately.Repo.Migrations.AddAgentRunsTable do
  use Ecto.Migration

  def change do
    create table(:agent_runs, primary_key: false) do
      add :id, :binary_id, primary_key: true

      add :agent_def_id, references(:agent_defs, type: :binary_id, on_delete: :delete_all),
        null: false

      add :status, :string, null: false
      add :started_at, :utc_datetime_usec, null: false
      add :finished_at, :utc_datetime_usec
      add :error_message, :text
      add :logs, :text

      timestamps()
    end
  end
end

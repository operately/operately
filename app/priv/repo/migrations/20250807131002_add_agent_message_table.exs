defmodule Operately.Repo.Migrations.AddAgentMessageTable do
  use Ecto.Migration

  def change do
    create table(:agent_messages, primary_key: false) do
      add :id, :binary_id, primary_key: true

      add :convo_id, references(:agent_convos, type: :binary_id, on_delete: :delete_all),
        null: false

      add :status, :string, null: false, default: "pending"
      add :message, :text, null: false

      timestamps()
    end
  end
end

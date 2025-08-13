defmodule Operately.Repo.Migrations.AddTitleToAgentConversations do
  use Ecto.Migration

  def change do
    alter table(:agent_convos) do
      add :title, :text, default: "Untitled Conversation"
    end
  end
end

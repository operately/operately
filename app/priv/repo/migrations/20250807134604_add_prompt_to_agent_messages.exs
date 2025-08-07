defmodule Operately.Repo.Migrations.AddPromptToAgentMessages do
  use Ecto.Migration

  def change do
    alter table(:agent_messages) do
      add :prompt, :text
      add :source, :string
    end
  end
end

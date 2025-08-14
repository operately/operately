defmodule Operately.Repo.Migrations.AddIndexToAgentMessages do
  use Ecto.Migration

  def change do
    alter table(:agent_messages) do
      add :index, :integer, default: 0
    end
  end
end

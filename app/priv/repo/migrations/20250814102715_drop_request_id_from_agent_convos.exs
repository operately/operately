defmodule Operately.Repo.Migrations.DropRequestIdFromAgentConvos do
  use Ecto.Migration

  def change do
    alter table(:agent_convos) do
      remove :request_id, :string
    end
  end
end

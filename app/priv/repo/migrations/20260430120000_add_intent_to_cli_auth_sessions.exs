defmodule Operately.Repo.Migrations.AddIntentToCliAuthSessions do
  use Ecto.Migration

  def change do
    alter table(:cli_auth_sessions) do
      add :intent, :string, null: false, default: "login"
    end
  end
end

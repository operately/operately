defmodule Operately.Repo.Migrations.SyncResourceHubActivityAccessContexts do
  use Ecto.Migration

  def change do
    Operately.Data.Change103SyncResourceHubActivityAccessContexts.run()
  end
end

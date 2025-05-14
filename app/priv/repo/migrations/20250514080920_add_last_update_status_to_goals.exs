defmodule Operately.Repo.Migrations.AddLastUpdateStatusToGoals do
  use Ecto.Migration

  def change do
    alter table(:goals) do
      add :last_update_status, :string
    end
  end
end

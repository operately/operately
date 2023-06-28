defmodule Operately.Repo.Migrations.AddScopeTypeAndScopeIdToActivities do
  use Ecto.Migration

  def change do
    alter table(:activities) do
      add :scope_type, :string
      add :scope_id, :binary_id
    end
  end
end

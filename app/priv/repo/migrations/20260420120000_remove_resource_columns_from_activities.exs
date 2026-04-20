defmodule Operately.Repo.Migrations.RemoveResourceColumnsFromActivities do
  use Ecto.Migration

  def change do
    alter table(:activities) do
      remove :resource_id
      remove :resource_type
    end
  end
end

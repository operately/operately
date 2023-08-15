defmodule Operately.Repo.Migrations.RemoveProjectKeyResourceTypeColumn do
  use Ecto.Migration

  def change do
    alter table(:project_key_resources) do
      remove :type
    end
  end
end

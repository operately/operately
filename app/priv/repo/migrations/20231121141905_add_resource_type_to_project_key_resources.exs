defmodule Operately.Repo.Migrations.AddResourceTypeToProjectKeyResources do
  use Ecto.Migration

  def change do
    alter table(:project_key_resources) do
      add :resource_type, :string, default: "generic"
    end
  end
end

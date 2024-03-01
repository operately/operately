defmodule Operately.Repo.Migrations.AddEntityIdAndEntityTypeToComments do
  use Ecto.Migration

  def change do
    alter table(:comments) do
      add :entity_id, :binary_id
      add :entity_type, :string
    end
  end
end

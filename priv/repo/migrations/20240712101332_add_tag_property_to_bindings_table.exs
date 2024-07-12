defmodule Operately.Repo.Migrations.AddTagPropertyToBindingsTable do
  use Ecto.Migration

  def change do
    alter table(:access_bindings) do
      add :tag, :string
    end
  end
end

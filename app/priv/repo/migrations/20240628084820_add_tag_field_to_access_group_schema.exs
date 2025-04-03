defmodule Operately.Repo.Migrations.AddTagFieldToAccessGroupSchema do
  use Ecto.Migration

  def change do
    alter table(:access_groups) do
      add :tag, :string
    end
  end
end

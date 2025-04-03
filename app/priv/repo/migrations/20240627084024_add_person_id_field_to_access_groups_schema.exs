defmodule Operately.Repo.Migrations.AddPersonIdFieldToAccessGroupsSchema do
  use Ecto.Migration

  def change do
    alter table(:access_groups) do
      add :person_id, references(:people, type: :binary_id, on_delete: :nothing)
    end

    create unique_index(:access_groups, [:person_id])
  end
end

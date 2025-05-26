defmodule Operately.Repo.Migrations.CascadeDeleteFromPeopleToActivities do
  use Ecto.Migration

  def up do
    drop constraint(:activities, :activities_author_id_fkey)

    alter table(:activities) do
      modify :author_id, references(:people, on_delete: :delete_all, type: :binary_id)
    end
  end

  def down do
    drop constraint(:activities, :activities_author_id_fkey)

    alter table(:activities) do
      modify :person_id, references(:people, on_delete: :nothing, type: :binary_id)
    end
  end
end

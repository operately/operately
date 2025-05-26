defmodule Operately.Repo.Migrations.CascadeDeleteFromPeopleToComments do
  use Ecto.Migration

  def up do
    drop constraint(:comments, :comments_author_id_fkey)

    alter table(:comments) do
      modify :author_id, references(:people, on_delete: :delete_all, type: :binary_id)
    end
  end

  def down do
    drop constraint(:comments, :comments_author_id_fkey)

    alter table(:comments) do
      modify :author_id, references(:people, on_delete: :nothing, type: :binary_id)
    end
  end
end

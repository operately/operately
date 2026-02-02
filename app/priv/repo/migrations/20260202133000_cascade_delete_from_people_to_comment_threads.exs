defmodule Operately.Repo.Migrations.CascadeDeleteFromPeopleToCommentThreads do
  use Ecto.Migration

  def up do
    drop constraint(:comment_threads, :comment_threads_author_id_fkey)

    alter table(:comment_threads) do
      modify :author_id, references(:people, type: :binary_id, on_delete: :delete_all)
    end
  end

  def down do
    drop constraint(:comment_threads, :comment_threads_author_id_fkey)

    alter table(:comment_threads) do
      modify :author_id, references(:people, type: :binary_id, on_delete: :nothing)
    end
  end
end

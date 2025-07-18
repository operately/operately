defmodule Operately.Repo.Migrations.AddAuthorIdToCommentThreads do
  use Ecto.Migration

  def change do
    alter table(:comment_threads) do
      add :author_id, references(:people, type: :binary_id, on_delete: :nothing)
    end
  end
end

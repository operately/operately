defmodule Operately.Repo.Migrations.AddCommentThreadsTable do
  use Ecto.Migration

  def change do
    create table(:comment_threads, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :message, :jsonb

      timestamps()
    end 
  end
end

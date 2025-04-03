defmodule Operately.Repo.Migrations.AddTitlesToCommentThreads do
  use Ecto.Migration

  def change do
    alter table(:comment_threads) do
      add :title, :string
      add :has_title, :boolean, default: false
    end
  end
end

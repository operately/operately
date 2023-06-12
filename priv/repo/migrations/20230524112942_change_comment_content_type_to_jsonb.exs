defmodule Operately.Repo.Migrations.ChangeCommentContentTypeToJsonb do
  use Ecto.Migration

  def change do
    alter table(:comments) do
      remove :content
      add :content, :jsonb
    end
  end
end

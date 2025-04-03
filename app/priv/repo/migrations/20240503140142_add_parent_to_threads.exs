defmodule Operately.Repo.Migrations.AddParentToThreads do
  use Ecto.Migration

  def change do
    alter table(:comment_threads) do
      add :parent_id, :binary_id
      add :parent_type, :string
    end
  end
end

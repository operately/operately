defmodule Operately.Repo.Migrations.CreateComments do
  use Ecto.Migration

  def change do
    create table(:comments, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :content, :text
      add :update_id, references(:updates, on_delete: :nothing, type: :binary_id)
      add :author_id, references(:people, on_delete: :nothing, type: :binary_id)

      timestamps()
    end

    create index(:comments, [:update_id])
    create index(:comments, [:author_id])
  end
end

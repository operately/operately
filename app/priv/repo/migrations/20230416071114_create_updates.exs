defmodule Operately.Repo.Migrations.CreateUpdates do
  use Ecto.Migration

  def change do
    create table(:updates, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :content, :text
      add :updatable_id, :uuid
      add :updatable_type, :string
      add :author_id, references(:people, on_delete: :nothing, type: :binary_id)

      timestamps()
    end

    create index(:updates, [:author_id])
  end
end

defmodule Operately.Repo.Migrations.CreateBlobs do
  use Ecto.Migration

  def change do
    create table(:blobs, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :filename, :string
      add :status, :string
      add :author_id, references(:people, on_delete: :nothing, type: :binary_id)

      timestamps()
    end

    create index(:blobs, [:author_id])
  end
end

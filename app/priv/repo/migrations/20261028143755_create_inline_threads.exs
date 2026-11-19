defmodule Operately.Repo.Migrations.CreateInlineThreads do
  use Ecto.Migration

  def change do
    create table(:inline_threads, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :resource_type, :string, null: false

      add :resource_id, references(:resource_documents, type: :binary_id, on_delete: :delete_all),
        null: false

      add :author_id, references(:people, type: :binary_id, on_delete: :nilify_all)
      add :resolved_by_id, references(:people, type: :binary_id, on_delete: :nilify_all)
      add :resolved_at, :utc_datetime
      add :anchor, :map, null: false

      timestamps()
    end

    create index(:inline_threads, [:resource_id, :inserted_at, :id])
  end
end

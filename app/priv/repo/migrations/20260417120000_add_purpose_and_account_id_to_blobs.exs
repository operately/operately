defmodule Operately.Repo.Migrations.AddPurposeAndAccountIdToBlobs do
  use Ecto.Migration

  def change do
    alter table(:blobs) do
      add :purpose, :string, null: false, default: "company_file"
      add :account_id, references(:accounts, type: :binary_id, on_delete: :nilify_all)
    end

    create index(:blobs, [:account_id])
    create index(:blobs, [:purpose, :account_id])
  end
end

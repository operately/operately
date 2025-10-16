defmodule Operately.Repo.Migrations.CreateInviteLinks do
  use Ecto.Migration

  def change do
    create table(:invite_links, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :token, :string, null: false

      add :company_id, references(:companies, on_delete: :delete_all, type: :binary_id),
        null: false

      add :author_id, references(:people, on_delete: :delete_all, type: :binary_id), null: false
      add :expires_at, :utc_datetime, null: false
      add :use_count, :integer, default: 0, null: false
      add :is_active, :boolean, default: true, null: false

      timestamps()
    end

    create unique_index(:invite_links, [:token])
    create index(:invite_links, [:company_id])
    create index(:invite_links, [:author_id])
    create index(:invite_links, [:expires_at])
    create index(:invite_links, [:is_active])
  end
end

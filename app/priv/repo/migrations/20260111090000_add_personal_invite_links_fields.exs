defmodule Operately.Repo.Migrations.AddPersonalInviteLinksFields do
  use Ecto.Migration

  def change do
    alter table(:invite_links) do
      add :expires_at, :utc_datetime
      add :type, :string
      add :person_id, references(:people, on_delete: :delete_all, type: :binary_id)
    end

    create index(:invite_links, [:person_id])
    create index(:invite_links, [:expires_at])
  end
end

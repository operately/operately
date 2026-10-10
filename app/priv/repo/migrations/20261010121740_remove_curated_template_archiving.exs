defmodule Operately.Repo.Migrations.RemoveCuratedTemplateArchiving do
  use Ecto.Migration

  def change do
    drop index(:curated_templates, [:state, :archived_at, :type, :category])

    alter table(:curated_templates) do
      remove :archived_at, :utc_datetime_usec
    end

    create index(:curated_templates, [:state, :type, :category])
  end
end

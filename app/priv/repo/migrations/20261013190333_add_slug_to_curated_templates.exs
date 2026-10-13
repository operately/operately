defmodule Operately.Repo.Migrations.AddSlugToCuratedTemplates do
  use Ecto.Migration

  def change do
    alter table(:curated_templates) do
      add :slug, :string, null: false
    end

    create unique_index(:curated_templates, [:slug, :content_language])
  end
end

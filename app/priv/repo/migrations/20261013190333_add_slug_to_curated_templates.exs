defmodule Operately.Repo.Migrations.AddSlugToCuratedTemplates do
  use Ecto.Migration

  def up do
    alter table(:curated_templates) do
      add :slug, :string
    end

    flush()
    Operately.Data.Change117BackfillCuratedTemplateSlugs.run()

    alter table(:curated_templates) do
      modify :slug, :string, null: false
    end

    create unique_index(:curated_templates, [:slug, :content_language])
  end

  def down do
    drop index(:curated_templates, [:slug, :content_language])

    alter table(:curated_templates) do
      remove :slug
    end
  end
end

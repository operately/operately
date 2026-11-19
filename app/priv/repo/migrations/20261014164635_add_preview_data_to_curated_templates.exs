defmodule Operately.Repo.Migrations.AddPreviewDataToCuratedTemplates do
  use Ecto.Migration

  def change do
    alter table(:curated_templates) do
      add :preview_data, :map, null: false, default: %{}
    end
  end
end

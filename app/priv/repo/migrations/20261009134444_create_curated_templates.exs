defmodule Operately.Repo.Migrations.CreateCuratedTemplates do
  use Ecto.Migration

  def change do
    create table(:curated_templates, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :type, :string, null: false
      add :state, :string, null: false, default: "draft"
      add :category, :string
      add :title, :string, null: false
      add :summary, :text
      add :content_language, :string, null: false, default: "en"
      add :definition, :map, null: false, default: %{}
      add :creator_account_id, references(:accounts, type: :binary_id, on_delete: :nilify_all)
      add :updater_account_id, references(:accounts, type: :binary_id, on_delete: :nilify_all)
      add :published_at, :utc_datetime_usec
      add :archived_at, :utc_datetime_usec
      timestamps(type: :utc_datetime_usec)
    end

    create index(:curated_templates, [:state, :archived_at, :type, :category])

    create constraint(:curated_templates, :curated_templates_valid_type,
             check: "type IN ('kpi', 'goal', 'project')"
           )

    create constraint(:curated_templates, :curated_templates_valid_state,
             check: "state IN ('draft', 'published')"
           )
  end
end

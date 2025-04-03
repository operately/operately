defmodule Operately.Repo.Migrations.AddStatusAndPublishedAtFieldsToDocumentSchema do
  use Ecto.Migration

  def change do
    alter table(:resource_documents) do
      add :state, :string, default: "published"
      add :published_at, :utc_datetime
    end
  end
end

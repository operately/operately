defmodule Operately.Repo.Migrations.ConvertProjectDescriptionToRichText do
  use Ecto.Migration

  def change do
    alter table(:projects) do
      remove :description
      add :description, :jsonb
    end
  end
end

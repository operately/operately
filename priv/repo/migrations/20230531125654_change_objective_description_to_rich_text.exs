defmodule Operately.Repo.Migrations.ChangeObjectiveDescriptionToRichText do
  use Ecto.Migration

  def change do
    alter table(:objectives) do
      remove :description
      add :description, :jsonb
    end
  end
end

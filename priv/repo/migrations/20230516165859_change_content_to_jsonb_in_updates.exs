defmodule Operately.Repo.Migrations.ChangeContentToJsonbInUpdates do
  use Ecto.Migration

  def change do
    alter table(:updates) do
      remove :content
      add :content, :jsonb
    end
  end
end

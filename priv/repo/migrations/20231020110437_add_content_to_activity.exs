defmodule Operately.Repo.Migrations.AddContentToActivity do
  use Ecto.Migration

  def change do
    alter table(:activities) do
      add :content, :jsonb
    end
  end
end

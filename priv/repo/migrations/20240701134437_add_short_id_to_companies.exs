defmodule Operately.Repo.Migrations.AddShortIdToCompanies do
  use Ecto.Migration

  def change do
    alter table(:companies) do
      add :short_id, :bigint
    end
  end
end

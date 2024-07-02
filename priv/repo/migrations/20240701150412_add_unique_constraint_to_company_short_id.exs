defmodule Operately.Repo.Migrations.AddUniqueConstraintToCompanyShortId do
  use Ecto.Migration

  def change do
    create unique_index(:companies, [:short_id])
  end
end

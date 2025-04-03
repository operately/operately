defmodule Operately.Repo.Migrations.AddContributorRole do
  use Ecto.Migration

  def change do
    alter table(:project_contributors) do
      add :role, :string
    end
  end
end

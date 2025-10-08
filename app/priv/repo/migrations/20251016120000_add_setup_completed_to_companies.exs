defmodule Operately.Repo.Migrations.AddSetupCompletedToCompanies do
  use Ecto.Migration

  def change do
    alter table(:companies) do
      add :setup_completed, :boolean, default: false, null: false
    end

    execute("UPDATE companies SET setup_completed = TRUE")
  end
end

defmodule Operately.Repo.Migrations.AddEnabledExperimentalFeaturesToCompanies do
  use Ecto.Migration

  def change do
    alter table(:companies) do
      add :enabled_experimental_features, {:array, :string}, default: []
    end
  end
end

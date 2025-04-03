defmodule Operately.Repo.Migrations.CreateDashboards do
  use Ecto.Migration

  def change do
    create table(:dashboards, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :company_id, references(:companies, on_delete: :nothing, type: :binary_id)

      timestamps()
    end

    create index(:dashboards, [:company_id])
  end
end

defmodule Operately.Repo.Migrations.CreateDashboardPanels do
  use Ecto.Migration

  def change do
    create table(:dashboard_panels, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :linked_resource_id, :uuid
      add :linked_resource_type, :string
      add :index, :integer
      add :dashboard_id, references(:dashboards, on_delete: :nothing, type: :binary_id)

      timestamps()
    end

    create index(:dashboard_panels, [:dashboard_id])
  end
end

defmodule Operately.Repo.Migrations.DeleteDashboardsAndDashboardPanels do
  use Ecto.Migration

  def change do
    alter table(:people) do
      remove :home_dashboard_id
    end

    drop table(:dashboard_panels)
    drop table(:dashboards)
  end
end

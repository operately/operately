defmodule Operately.Repo.Migrations.LinkHomeDashboardToPerson do
  use Ecto.Migration

  def change do
    alter table(:people) do
      add :home_dashboard_id, references(:dashboards, on_delete: :nilify_all, type: :binary_id)
    end
  end
end

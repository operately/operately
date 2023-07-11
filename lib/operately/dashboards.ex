defmodule Operately.Dashboards do
  import Ecto.Query, warn: false
  alias Operately.Repo

  alias Operately.Dashboards.Dashboard

  def list_dashboards do
    Repo.all(Dashboard)
  end

  def get_dashboard!(id), do: Repo.get!(Dashboard, id)

  def create_dashboard(attrs \\ %{}) do
    %Dashboard{}
    |> Dashboard.changeset(attrs)
    |> Repo.insert()
  end

  def update_dashboard(%Dashboard{} = dashboard, attrs) do
    dashboard
    |> Dashboard.changeset(attrs)
    |> Repo.update()
  end

  def delete_dashboard(%Dashboard{} = dashboard) do
    Repo.delete(dashboard)
  end

  def change_dashboard(%Dashboard{} = dashboard, attrs \\ %{}) do
    Dashboard.changeset(dashboard, attrs)
  end

  alias Operately.Dashboards.Panel

  def list_dashboard_panels do
    Repo.all(Panel)
  end

  def get_panel!(id), do: Repo.get!(Panel, id)

  def create_panel(attrs \\ %{}) do
    %Panel{}
    |> Panel.changeset(attrs)
    |> Repo.insert()
  end

  def update_panel(%Panel{} = panel, attrs) do
    panel
    |> Panel.changeset(attrs)
    |> Repo.update()
  end

  def delete_panel(%Panel{} = panel) do
    Repo.delete(panel)
  end

  def change_panel(%Panel{} = panel, attrs \\ %{}) do
    Panel.changeset(panel, attrs)
  end
end

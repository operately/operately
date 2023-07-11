defmodule Operately.DashboardsFixtures do
  @moduledoc """
  This module defines test helpers for creating
  entities via the `Operately.Dashboards` context.
  """

  @doc """
  Generate a dashboard.
  """
  def dashboard_fixture(attrs \\ %{}) do
    {:ok, dashboard} =
      attrs
      |> Enum.into(%{

      })
      |> Operately.Dashboards.create_dashboard()

    dashboard
  end

  @doc """
  Generate a panel.
  """
  def panel_fixture(attrs \\ %{}) do
    {:ok, panel} =
      attrs
      |> Enum.into(%{
        index: 42,
        linked_resource_id: "7488a646-e31f-11e4-aace-600308960662",
        linked_resource_type: "some linked_resource_type"
      })
      |> Operately.Dashboards.create_panel()

    panel
  end
end
